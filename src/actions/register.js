"use server";

import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import ExpertProfile from "@/models/ExpertProfile";
import { sendOtpEmail } from "@/lib/email";
import { z } from "zod";
import { generateFromEmail } from "unique-username-generator";
import { otpRateLimit } from "@/lib/limiter";
import { generateSecureOtp } from "@/lib/utils";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function registerUser(values) {
  try {
    const validatedFields = registerSchema.safeParse(values);
    if (!validatedFields.success) return { error: "Invalid fields!" };

    let { name, email, password } = validatedFields.data;

    // 🔥 Normalize email ALWAYS
    const normalizedEmail = email.toLowerCase();

    // Rate limit should use normalizedEmail
    const { success } = await otpRateLimit.limit(normalizedEmail);
    if (!success) return { error: "Too many attempts. Wait 10 minutes." };

    await connectDB();

    /* -------------------------------------------------------------
     * 1. CHECK FOR EXISTING Expert ACCOUNT (Case-insensitive)
     * ------------------------------------------------------------ */
    const existingUser = await User.findOne({
      email: normalizedEmail,
      role: "expert",
    });

    if (existingUser && existingUser.isVerified) {
      return { error: "An expert account with this email already exists." };
    }

    /* -------------------------------------------------------------
     * 2. SECURE OTP + HASHING
     * ------------------------------------------------------------ */
    const otp = generateSecureOtp(6); // plaintext sent to user
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(password, 10);

    let userToUpdate = null;

    /* -------------------------------------------------------------
     * 3. HANDLE USER CREATION / UPDATE
     * ------------------------------------------------------------ */
    if (existingUser && !existingUser.isVerified) {
      // Overwrite incomplete registration
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.otp = otpHash;
      existingUser.otpExpiry = otpExpiry;

      await existingUser.save();
      userToUpdate = existingUser;
    } else {
      // Create brand NEW expert user
      const username = generateFromEmail(normalizedEmail, 3);

      userToUpdate = await User.create({
        name,
        email: normalizedEmail, // 🔥 FIXED
        password: hashedPassword,
        image: `https://ui-avatars.com/api/?name=${name}&background=random`,
        username,
        otp: otpHash,
        otpExpiry,
        isVerified: false,
        role: "expert",
      });

      // Create empty Expert Profile
      await ExpertProfile.create({ user: userToUpdate._id });
    }

    /* -------------------------------------------------------------
     * 4. SEND OTP (Transactional Email)
     * ------------------------------------------------------------ */
    const emailSent = await sendOtpEmail(normalizedEmail, otp);

    if (!emailSent) {
      // If newly created, clean up to avoid stuck accounts
      if (!existingUser) {
        await User.findByIdAndDelete(userToUpdate._id);
        await ExpertProfile.findOneAndDelete({ user: userToUpdate._id });
      }
      return { error: "Failed to send verification email. Please try again." };
    }

    return { success: "OTP sent.", email: normalizedEmail };

  } catch (error) {
    console.error("Registration Error:", error);
    return { error: "Something went wrong!" };
  }
}
