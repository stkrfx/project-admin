"use server";

import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import ExpertProfile from "@/models/ExpertProfile";
import { sendOtpEmail } from "@/lib/email";
import { z } from "zod";
import { generateFromEmail } from "unique-username-generator";
import { otpRateLimit } from "@/lib/limiter";
import { generateSecureOtp } from "@/lib/utils";
import mongoose from "mongoose";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function registerUser(values) {
  try {
    const validated = registerSchema.safeParse(values);
    if (!validated.success) return { error: "Invalid fields!" };

    let { name, email, password } = validated.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Rate limit
    const { success } = await otpRateLimit.limit(normalizedEmail);
    if (!success) return { error: "Too many attempts. Wait 10 minutes." };

    await connectDB();

    const existingUser = await User.findOne({
      email: normalizedEmail,
      role: "expert",
    });

    /* -----------------------------------------------------------
     * Anti-enumeration: Never expose user existence
     * ----------------------------------------------------------- */
    if (existingUser && existingUser.isVerified) {
      return {
        success: "If an account exists, a verification code has been sent.",
        email: normalizedEmail,
      };
    }

    // Build OTP + password hash
    const otp = generateSecureOtp(6);
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(password, 10);

    let userRecord = existingUser;
    let mustSendEmailAfterCommit = false;

    /* -----------------------------------------------------------
     * CASE 1 → Update unverified user silently
     * ----------------------------------------------------------- */
    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.otp = otpHash;
      existingUser.otpExpiry = otpExpiry;
      await existingUser.save();
      mustSendEmailAfterCommit = true; // will send later
    }

    /* -----------------------------------------------------------
     * CASE 2 → CREATE NEW USER IN TRANSACTION
     * ----------------------------------------------------------- */
    if (!existingUser) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const username = generateFromEmail(normalizedEmail, 3);

        const newUser = await User.create(
          [
            {
              name,
              email: normalizedEmail,
              password: hashedPassword,
              image: `https://ui-avatars.com/api/?name=${name}&background=random`,
              username,
              otp: otpHash,
              otpExpiry,
              isVerified: false,
              role: "expert",
            },
          ],
          { session }
        );

        userRecord = newUser[0];

        await ExpertProfile.create([{ user: userRecord._id }], { session });

        // IMPORTANT FIX:
        // -------------------------------------------------------
        // COMMIT FIRST → release DB locks BEFORE sending email
        // -------------------------------------------------------
        await session.commitTransaction();
        session.endSession();

        mustSendEmailAfterCommit = true;
      } catch (err) {
        console.error("Transaction Error:", err);
        await session.abortTransaction();
        session.endSession();
        return { error: "Registration failed. Please try again." };
      }
    }

    /* -----------------------------------------------------------
     * SEND EMAIL AFTER DB COMMIT (Non-blocking)
     * ----------------------------------------------------------- */
    if (mustSendEmailAfterCommit) {
      try {
        await sendOtpEmail(normalizedEmail, otp);
      } catch (emailError) {
        console.error("Email failed after commit:", emailError);

        return {
          success: "Account created, but email failed. Please use Resend OTP.",
          email: normalizedEmail,
        };
      }
    }

    return {
      success: "If an account exists, a verification code has been sent.",
      email: normalizedEmail,
    };
  } catch (err) {
    console.error("Registration Error:", err);
    return { error: "Something went wrong. Please try again." };
  }
}
