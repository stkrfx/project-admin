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

/* -------------------------- SCHEMA -------------------------- */
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

/* -------------------------- ANTI-TIMING FUNCTION -------------------------- */
async function fakeWork() {
  await bcrypt.hash("dummy_password_!@#$", 10); // simulate bcrypt work
  await new Promise((res) => setTimeout(res, 10 + Math.random() * 30)); // jitter
}

/* -------------------------- REGISTER USER -------------------------- */
export async function registerUser(values) {
  try {
    /* -------------------------- VALIDATION -------------------------- */
    const validated = registerSchema.safeParse(values);
    if (!validated.success) return { error: "Invalid fields!" };

    let { name, email, password } = validated.data;
    const normalizedEmail = email.trim().toLowerCase();

    /* -------------------------- RATE LIMIT -------------------------- */
    const { success } = await otpRateLimit.limit(normalizedEmail);
    if (!success)
      return { error: "Too many attempts. Wait 10 minutes." };

    await connectDB();

    /* -------------------------- FIND EXISTING USER -------------------------- */
    const existingUser = await User.findOne({
      email: normalizedEmail,
      role: "expert",
    });

    /* ---------------------------------------------------------------
     * CASE A — USER EXISTS & VERIFIED
     * DO NOT reveal existence → do fake work to match timing
     * --------------------------------------------------------------- */
    if (existingUser && existingUser.isVerified) {
      await fakeWork();
      return {
        success:
          "If an account exists, a verification code has been sent.",
        email: normalizedEmail,
      };
    }

    /* -------------------------- PREP OTP + PASSWORD -------------------------- */
    const otp = generateSecureOtp(6);
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(password, 10);

    let userRecord = existingUser;
    let mustSendEmailAfterCommit = false;

    /* ---------------------------------------------------------------
     * CASE B — USER EXISTS BUT NOT VERIFIED
     * 🔥 ATOMIC UPDATE FIX (secure)
     * --------------------------------------------------------------- */
    if (existingUser && !existingUser.isVerified) {
      const updatedUser = await User.findOneAndUpdate(
        {
          _id: existingUser._id,
          isVerified: false, // CONDITIONAL: only update if still unverified
        },
        {
          $set: {
            name: name,
            password: hashedPassword,
            otp: otpHash,
            otpExpiry: otpExpiry,
          },
        },
        { new: true }
      );

      if (updatedUser) {
        userRecord = updatedUser;
        mustSendEmailAfterCommit = true;
      }
    }

    /* ---------------------------------------------------------------
     * CASE C — NEW USER → CREATE IN TRANSACTION
     * --------------------------------------------------------------- */
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

        await ExpertProfile.create(
          [{ user: userRecord._id }],
          { session }
        );

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

    /* -------------------------- SEND OTP (AFTER COMMIT) -------------------------- */
    if (mustSendEmailAfterCommit) {
      try {
        await sendOtpEmail(normalizedEmail, otp);
      } catch (emailError) {
        console.error("Email failed after commit:", emailError);

        return {
          success:
            "Account created, but email failed. Please use Resend OTP.",
          email: normalizedEmail,
        };
      }
    }

    /* ---------------------------------------------------------------
     * FINAL RESPONSE (ANTI-ENUMERATION)
     * --------------------------------------------------------------- */
    return {
      success:
        "If an account exists, a verification code has been sent.",
      email: normalizedEmail,
    };
  } catch (err) {
    console.error("Registration Error:", err);
    return { error: "Something went wrong. Please try again." };
  }
}
