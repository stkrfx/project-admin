"use server";

import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { sendOtpEmail } from "@/lib/email";
import { z } from "zod";
import { generateFromEmail } from "unique-username-generator"; // Import this

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function registerUser(values) {
  try {
    const validatedFields = registerSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid fields!" };
    }

    const { name, email, password } = validatedFields.data;

    await connectDB();

    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isVerified) {
      return { error: "Email already in use!" };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); 
    const hashedPassword = await bcrypt.hash(password, 10);

    // NEW: Generate a unique username
    const username = generateFromEmail(email, 3); // Adds 3 random digits to ensure uniqueness

    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.otp = otp;
      existingUser.otpExpiry = otpExpiry;
      // We don't update username here to keep it consistent, 
      // or you can update it if you want fresh logic every time.
      await existingUser.save();
    } else {
      await User.create({
        name,
        email,
        password: hashedPassword,
        image: `https://ui-avatars.com/api/?name=${name}&background=random`, // Optional: Add a default avatar
        username, // <--- Save the generated username
        otp,
        otpExpiry,
        isVerified: false,
      });
    }

    await sendOtpEmail(email, otp);

    return { success: "OTP sent to your email.", email };
  } catch (error) {
    console.error("Registration Error:", error);
    // Handle duplicate username edge case (rare but possible)
    if (error.code === 11000 && error.keyPattern?.username) {
        return { error: "Username taken, please try again." };
    }
    return { error: "Something went wrong!" };
  }
}