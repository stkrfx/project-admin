"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { authRateLimit } from "@/lib/limiter";

export async function verifyOtp(email, otp) {
  try {
    // Normalize email ALWAYS (Trim & Lowercase)
    // [!code change] Added .trim()
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !otp) {
      return { error: "Missing required fields." };
    }

    // Rate Limit: Prevent brute-forcing the OTP
    const { success } = await authRateLimit.limit(normalizedEmail);
    if (!success) {
      return { error: "Too many attempts. Please try again in 15 minutes." };
    }

    await connectDB();

    // Always query using normalized email
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+otp +otpExpiry"
    );

    if (!user) {
      return { error: "User not found." };
    }

    if (user.isVerified) {
      return { success: "User already verified." };
    }

    // Check OTP hash
    const isValid = await bcrypt.compare(otp, user.otp);
    if (!isValid) {
      return { error: "Invalid OTP." };
    }

    // Expiry check
    if (user.otpExpiry < new Date()) {
      return { error: "OTP has expired. Please register again." };
    }

    // Mark verified & clean OTP fields
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