"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import { sendOtpEmail } from "@/lib/email";
import { otpRateLimit } from "@/lib/limiter";
import { generateSecureOtp } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function resendOtp(email) {
  try {
    // [!code change] Normalize email ALWAYS (Trim added)
    const normalizedEmail = email?.trim().toLowerCase();
    
    if (!normalizedEmail) return { error: "Email is required." };

    // Rate limit by normalized email
    const { success } = await otpRateLimit.limit(normalizedEmail);
    if (!success) return { error: "Rate limit exceeded. Wait 10 mins." };

    await connectDB();

    // Use normalized email in DB query
    const user = await User.findOne({ email: normalizedEmail, role: "expert" }).select(
      "+otp +otpExpiry"
    );

    // SECURITY: Prevent user enumeration
    if (!user) {
      return { success: "New code sent!" };
    }

    if (user.isVerified) {
      return { success: "Already verified." };
    }

    // Generate OTP
    const otp = generateSecureOtp(6);
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Update user
    user.otp = otpHash;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    await sendOtpEmail(normalizedEmail, otp);

    return { success: "New code sent!" };
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return { error: "Failed to resend code." };
  }
}