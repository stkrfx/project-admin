"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/email";
import { z } from "zod";
import crypto from "crypto";
import { otpRateLimit } from "@/lib/limiter";

const forgotSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
});

export async function forgotPassword(values) {
  try {
    const validatedFields = forgotSchema.safeParse(values);
    if (!validatedFields.success) return { error: "Invalid email." };

    const { email } = validatedFields.data;

    const { success } = await otpRateLimit.limit(email);
    if (!success) {
      return { error: "Too many requests. Please wait 10 minutes." };
    }

    await connectDB();

    const user = await User.findOne({ email, role: "expert" });

    // SECURITY: Prevent User Enumeration
    // Return success message even if user not found.
    if (!user || user.provider === "google") {
      return { success: "If an account exists, a reset link has been sent." };
    }

    // Generate Token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
    await user.save();

    await sendPasswordResetEmail(email, resetToken);

    return { success: "If an account exists, a reset link has been sent." };

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}