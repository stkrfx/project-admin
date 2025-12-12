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

    /* -------------------------------------------------------------
     * ⭐ SECURE RATE-LIMITING IP EXTRACTION
     * - headers() works in server actions, but req.ip does NOT
     * - Pick the safest available real client IP
     * ------------------------------------------------------------- */
    const headerStore = await headers();

    const ip =
      headerStore.get("x-real-ip") ||
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";

    const { success } = await authRateLimit.limit(ip);
    if (!success) {
      return {
        error: "Too many attempts. Please try again in 15 minutes.",
      };
    }

    /* -------------------------------------------------------------
     * VERIFY TOKEN
     * ------------------------------------------------------------- */
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await connectDB();

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+tokenVersion");

    if (!user) {
      return {
        error: "Invalid or expired reset link. Please request a new one.",
      };
    }

    /* -------------------------------------------------------------
     * UPDATE PASSWORD + INVALIDATE SESSIONS
     * ------------------------------------------------------------- */
    user.password = await bcrypt.hash(password, 10);

    // invalidate all existing sessions
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    if (!user.isVerified) {
      user.isVerified = true;
    }

    await user.save();

    return {
      success: "Password updated successfully! Please log in again.",
    };
  } catch (error) {
    console.error("Reset Password Error:", error);
    return { error: "Something went wrong." };
  }
}
