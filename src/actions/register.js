"use server";

import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import ExpertProfile from "@/models/ExpertProfile";
import { sendOtpEmail } from "@/lib/email";
import { z } from "zod";
import { generateFromEmail } from "unique-username-generator";
import { otpRateLimit } from "@/lib/limiter";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function registerUser(values) {
  try {
    const validatedFields = registerSchema.safeParse(values);
    if (!validatedFields.success) return { error: "Invalid fields!" };

    const { name, email, password } = validatedFields.data;

    const { success } = await otpRateLimit.limit(email);
    if (!success) return { error: "Too many attempts. Wait 10 minutes." };

    await connectDB();

    // CHECK FOR EXISTING *EXPERT* ACCOUNT
    const existingUser = await User.findOne({ 
      email: email, 
      role: "expert" 
    });

    if (existingUser && existingUser.isVerified) {
      return { error: "An expert account with this email already exists." };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(password, 10);
    const username = generateFromEmail(email, 3);

    if (existingUser && !existingUser.isVerified) {
      // Update pending expert account
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.otp = otp;
      existingUser.otpExpiry = otpExpiry;
      await existingUser.save();
    } else {
      // Create NEW Expert Account
      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        image: `https://ui-avatars.com/api/?name=${name}&background=random`,
        username,
        otp,
        otpExpiry,
        isVerified: false,
        role: "expert", // <--- FORCE ROLE
      });

      // Initialize Empty Profile
      await ExpertProfile.create({
        user: newUser._id,
      });
    }

    await sendOtpEmail(email, otp);
    return { success: "OTP sent.", email };

  } catch (error) {
    console.error("Registration Error:", error);
    return { error: "Something went wrong!" };
  }
}