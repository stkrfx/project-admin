"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { authRateLimit } from "@/lib/limiter";

export async function verifyOtp(email, otp) {
  try {
    // Normalize ALWAYS (trim + lowercase)
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !otp) {
      return { error: "Invalid request." }; // Generic response
    }

    // Rate limit OTP attempts
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

    // ❗ Security: NEVER reveal user existence
    if (!user) {
      return { error: "Invalid request." };
    }

    // Already verified
    if (user.isVerified) {
      return { success: "User already verified." };
    }

    // Compare OTP with hash
    const isValid = await bcrypt.compare(otp, user.otp);

    if (!isValid) {
      return { error: "Invalid OTP." }; // Generic, safe
    }

    // Check expiry
    if (user.otpExpiry < new Date()) {
      return { error: "OTP has expired. Please request a new one." };
    }

    // Mark verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return { success: "Account verified successfully!" };
  } catch (error) {
    console.error("Verification Error:", error);
    return { error: "Verification failed." };
  }
}
