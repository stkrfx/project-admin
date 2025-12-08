"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";

export async function verifyOtp(email, otp) {
  try {
    if (!email || !otp) {
      return { error: "Missing required fields." };
    }

    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      return { error: "User not found." };
    }

    if (user.isVerified) {
      return { success: "User already verified." };
    }

    // Check OTP match
    if (user.otp !== otp) {
      return { error: "Invalid OTP." };
    }

    // Check Expiry
    if (user.otpExpiry < new Date()) {
      return { error: "OTP has expired. Please register again." };
    }

    // Verify User
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