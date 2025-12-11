"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import { sendOtpEmail } from "@/lib/email";
import { otpRateLimit } from "@/lib/limiter";

export async function resendOtp(email) {
  try {
    if (!email) return { error: "Email is required" };

    const { success } = await otpRateLimit.limit(email);
    if (!success) return { error: "Rate limit exceeded. Wait 10 mins." };

    await connectDB();
    
    // FIND EXPERT USER
    const user = await User.findOne({ 
      email: email, 
      role: "expert" 
    });

    if (!user) return { error: "Account not found" };
    if (user.isVerified) return { success: "Already verified" };

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOtpEmail(email, otp);
    return { success: "New code sent!" };
  } catch (error) {
    return { error: "Failed to resend code." };
  }
}