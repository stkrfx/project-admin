"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { authRateLimit } from "@/lib/limiter";
import { headers } from "next/headers";

/**
 * Strong password regex (same as registration):
 * - Min 8 chars
 * - At least 1 uppercase
 * - At least 1 lowercase
 * - At least 1 digit
 * - At least 1 special char
 */
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const resetSchema = z.object({
  token: z.string().min(1, "Token is missing"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      STRONG_PASSWORD_REGEX,
      "Password must include uppercase, lowercase, number, and special character"
    ),
});

export async function resetPassword(values) {
  try {
    const validated = resetSchema.safeParse(values);
    if (!validated.success) {
      return { error: validated.error.issues[0].message };
    }

    const { token, password } = validated.data;

    // 📌 RATE LIMIT — Prevent brute-force or abuse
    const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
    const { success } = await authRateLimit.limit(ip);
    if (!success) {
      return { error: "Too many attempts. Please try again in 15 minutes." };
    }

    // 📌 Hash token to match stored value
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await connectDB();

    // 📌 Lookup user with valid token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+tokenVersion");

    if (!user) {
      return { error: "Invalid or expired reset link. Please request a new one." };
    }

    // 📌 Update password
    user.password = await bcrypt.hash(password, 10);

    // 📌 Invalidate ALL active sessions immediately
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    // 📌 Clear token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    // Verify email if this was their first valid auth action
    if (!user.isVerified) {
      user.isVerified = true;
    }

    await user.save();

    return { success: "Password updated successfully! Please log in again." };
  } catch (error) {
    console.error("Reset Password Error:", error);
    return { error: "Something went wrong." };
  }
}
