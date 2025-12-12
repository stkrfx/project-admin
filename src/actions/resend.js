"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import { sendOtpEmail } from "@/lib/email";
import { otpRateLimit } from "@/lib/limiter";
import { generateSecureOtp } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function resendOtp(email) {
  try {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) return { error: "Email is required." };

    // Rate limit by normalized email
    const { success } = await otpRateLimit.limit(normalizedEmail);
    if (!success) return { error: "Rate limit exceeded. Wait 10 mins." };

    await connectDB();

    // Fetch user safely
    const user = await User.findOne({
      email: normalizedEmail,
      role: "expert",
    }).select("+otp +otpExpiry");

    // ---------------------------------------------
    // 🚫 SECURITY: NEVER reveal user existence
    // ---------------------------------------------

    // CASE A: User does NOT exist → pretend success
    if (!user) {
      return { success: "New code sent!" };
    }

    // CASE B: User exists AND is verified → pretend success, no OTP sent
    if (user.isVerified) {
      return { success: "New code sent!" };
    }

    // CASE C: User exists AND is NOT verified → issue new OTP
    const otp = generateSecureOtp(6);
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otpHash;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOtpEmail(normalizedEmail, otp);

    // Always return generic success
    return { success: "New code sent!" };

  } catch (error) {
    console.error("Resend OTP Error:", error);
    // Even on error, avoid leaking state
    return { error: "Failed to resend code." };
  }
}
