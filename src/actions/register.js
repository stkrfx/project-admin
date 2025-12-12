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
import mongoose from "mongoose";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function registerUser(values) {
  try {
    const validated = registerSchema.safeParse(values);
    if (!validated.success) return { error: "Invalid fields!" };

    let { name, email, password } = validated.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Rate limit
    const { success } = await otpRateLimit.limit(normalizedEmail);
    if (!success) return { error: "Too many attempts. Wait 10 minutes." };

    await connectDB();

    const existingUser = await User.findOne({
      email: normalizedEmail,
      role: "expert",
    });

    /* -----------------------------------------------------------
     * DO NOT reveal if account exists (Anti enumeration)
     * Verified account → pretend OTP sent
     * ----------------------------------------------------------- */
    if (existingUser && existingUser.isVerified) {
      return {
        success: "If an account exists, a verification code has been sent.",
        email: normalizedEmail,
      };
    }

    // Prepare OTP + password hash
    const otp = generateSecureOtp(6);
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(password, 10);

    let userRecord = existingUser;

    /* -----------------------------------------------------------
     * CASE 1 → Unverified existing user → Update silently
     * ----------------------------------------------------------- */
    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.otp = otpHash;
      existingUser.otpExpiry = otpExpiry;
      await existingUser.save();
    }

    /* -----------------------------------------------------------
     * CASE 2 → Create new user WITH TRANSACTION
     * ----------------------------------------------------------- */
    if (!existingUser) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const username = generateFromEmail(normalizedEmail, 3);

        const newUser = await User.create(
          [
            {
              name,
              email: normalizedEmail,
              password: hashedPassword,
              image: `https://ui-avatars.com/api/?name=${name}&background=random`,
              username,
              otp: otpHash,
              otpExpiry,
              isVerified: false,
              role: "expert",
            },
          ],
          { session }
        );

        userRecord = newUser[0];

        await ExpertProfile.create([{ user: userRecord._id }], { session });

        // Try to send email BEFORE committing DB changes
        const sent = await sendOtpEmail(normalizedEmail, otp);

        if (!sent) {
          // Rollback safely — NO ghost accounts remain
          await session.abortTransaction();
          session.endSession();
          return { error: "Failed to send verification email. Please try again." };
        }

        // Commit DB changes ONLY if email succeeded
        await session.commitTransaction();
        session.endSession();
      } catch (dbErr) {
        console.error("Transaction Error:", dbErr);
        await session.abortTransaction();
        session.endSession();
        return { error: "Registration failed. Please try again." };
      }
    } else {
      // Existing unverified → email send
      await sendOtpEmail(normalizedEmail, otp);
    }

    return {
      success: "If an account exists, a verification code has been sent.",
      email: normalizedEmail,
    };
  } catch (err) {
    console.error("Registration Error:", err);
    return { error: "Something went wrong. Please try again." };
  }
}
