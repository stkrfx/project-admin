"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { authRateLimit } from "@/lib/limiter";

export async function verifyOtp(email, otp) {
  try {
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !otp) {
      return { error: "Verification failed. Invalid code or email." };
    }

    // Rate limit all OTP attempts
    const { success } = await authRateLimit.limit(normalizedEmail);
    if (!success) {
      return {
        error: "Too many attempts. Please try again in 15 minutes.",
      };
    }

    await connectDB();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+otp +otpExpiry"
    );

    // ❌ DO NOT reveal whether user exists or is verified
    if (!user || user.isVerified) {
      return { error: "Verification failed. Invalid code or email." };
    }

    // Validate OTP against stored hash
    const isValidOtp = await bcrypt.compare(otp, user.otp);
    if (!isValidOtp) {
      return { error: "Verification failed. Invalid code or email." };
    }

    // Check expiry
    if (user.otpExpiry < new Date()) {
      return { error: "Verification failed. Invalid code or email." };
    }

    // OTP is correct → verify user
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return { success: "Account verified successfully!" };
  } catch (error) {
    console.error("Verification Error:", error);
    return { error: "Verification failed. Invalid code or email." };
  }
}
