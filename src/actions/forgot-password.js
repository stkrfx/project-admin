"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/email";
import { z } from "zod";
import crypto from "crypto";
import { otpRateLimit } from "@/lib/limiter"; // Re-using strict rate limiter

const forgotSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
});

export async function forgotPassword(values) {
  try {
    const validatedFields = forgotSchema.safeParse(values);
    if (!validatedFields.success) return { error: "Invalid email." };

    const { email } = validatedFields.data;

    // 1. RATE LIMIT (Prevent Email Bombing)
    const { success } = await otpRateLimit.limit(email);
    if (!success) {
      return { error: "Too many requests. Please wait 10 minutes." };
    }

    await connectDB();

    // 2. FIND USER (Strictly Scoped to EXPERT Role)
    // We don't want to reset their "Patient" password from the "Doctor" portal.
    const user = await User.findOne({ 
      email, 
      role: "expert" 
    });

    if (!user) {
      // SECURITY: Don't reveal if user doesn't exist.
      // Return success to confuse hackers scraping emails.
      return { success: "If an account exists, a reset link has been sent." };
    }

    if (user.provider === "google") {
        return { error: "This account uses Google Sign-In. Please sign in with Google." };
    }

    // 3. GENERATE TOKEN
    // Create a random token
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Hash it before saving to DB (Security Best Practice)
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // 4. SAVE TO DB
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 Hour
    await user.save();

    // 5. SEND EMAIL (Send the RAW token, not the hash)
    await sendPasswordResetEmail(email, resetToken);

    return { success: "If an account exists, a reset link has been sent." };

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}