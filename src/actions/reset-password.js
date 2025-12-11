"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const resetSchema = z.object({
  token: z.string().min(1, "Token is missing"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function resetPassword(values) {
  try {
    const validated = resetSchema.safeParse(values);
    if (!validated.success) return { error: "Invalid data." };

    const { token, password } = validated.data;

    // 1. Hash the token to match DB storage
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await connectDB();

    // 2. Find user with valid, non-expired token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return { error: "Invalid or expired token. Please request a new link." };
    }

    // 3. Update Password & Clear Token
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    // Ensure they are verified if they successfully reset password (optional but helpful)
    if (!user.isVerified) user.isVerified = true;

    await user.save();

    return { success: "Password updated! You can now login." };
  } catch (error) {
    console.error("Reset Password Error:", error);
    return { error: "Something went wrong." };
  }
}