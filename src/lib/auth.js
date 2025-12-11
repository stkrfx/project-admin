import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { generateFromEmail } from "unique-username-generator";
import { authRateLimit } from "@/lib/limiter";

export const authOptions = {
  providers: [
    // ------------------------------------------------
    // GOOGLE PROVIDER
    // ------------------------------------------------
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // ------------------------------------------------
    // CREDENTIALS PROVIDER (PASSWORD + OTP)
    // ------------------------------------------------
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
      },

      async authorize(credentials) {
        // 1. RATE LIMIT
        if (credentials?.email) {
          const { success } = await authRateLimit.limit(credentials.email);
          if (!success)
            throw new Error("Too many login attempts. Try again later.");
        }

        await connectDB();

        // 2. FIND EXPERT ACCOUNT (WITH OTP FIELDS)
        const user = await User.findOne({
          email: credentials.email,
          role: "expert",
        }).select("+password +otp +otpExpiry"); // ⭐ FIXED

        if (!user) throw new Error("No expert account found. Please register.");

        // 3. BAN CHECK
        if (user.isBanned) {
          throw new Error("This account has been suspended.");
        }

        // ------------------------------------------------
        // 🔐 OTP LOGIN (Email Verification / Registration)
        // ------------------------------------------------
        if (credentials.otp) {
          if (!user.otp || !user.otpExpiry)
            throw new Error("No OTP issued. Please request a new one.");

          if (user.otp !== credentials.otp)
            throw new Error("Invalid OTP");

          if (user.otpExpiry < new Date())
            throw new Error("OTP has expired");

          user.isVerified = true;
          user.otp = undefined;
          user.otpExpiry = undefined;
          await user.save();

          return user;
        }

        // ------------------------------------------------
        // 🔒 PASSWORD LOGIN
        // ------------------------------------------------
        if (credentials.password) {
          if (!user.password)
            throw new Error("Please login with Google or reset your password.");

          if (!user.isVerified)
            throw new Error("Please verify your email first.");

          const isMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isMatch) throw new Error("Invalid credentials");

          return user;
        }

        throw new Error("Invalid credentials");
      },
    }),
  ],

  // ------------------------------------------------
  // CALLBACKS
  // ------------------------------------------------
  callbacks: {
    // ------------------------------------------------
    // GOOGLE SIGN-IN CALLBACK (ACCOUNT LINKING)
    // ------------------------------------------------
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        try {
          await connectDB();

          const existingUser = await User.findOne({
            email: user.email,
            role: "expert",
          });

          if (existingUser) {
            if (existingUser.isBanned) return false;

            // LINK GOOGLE IF NOT ALREADY LINKED
            if (!existingUser.googleId) {
              existingUser.googleId = profile.sub;
            }

            // Set avatar only if generic
            const isGeneric =
              !existingUser.image ||
              existingUser.image.includes("ui-avatars.com");
            if (isGeneric && profile.picture) {
              existingUser.image = profile.picture;
            }

            if (!existingUser.isVerified) {
              existingUser.isVerified = true;
            }

            await existingUser.save();
            return true;
          }

          // NO EXPERT EXISTS → CREATE ONE
          const username = generateFromEmail(user.email, 3);

          await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            username,
            role: "expert",
            provider: "google",
            googleId: profile.sub,
            isVerified: true,
          });

          return true;
        } catch (error) {
          console.error("Google Sign-In Error:", error);
          return false;
        }
      }

      return true;
    },

    // ------------------------------------------------
    // JWT CALLBACK
    // ------------------------------------------------
    async jwt({ token, user, trigger, session }) {
      // On first login
      if (user) {
        token.id = user.id;
        token.picture = user.image;
        token.role = user.role;
      }

      // When profile-form triggers session update()
      if (trigger === "update" && session) {
        token.name = session.user.name;
        token.email = session.user.email;
        token.picture = session.user.image;
        return token;
      }

      // Revalidate Token -> Refresh user image/name if changed in DB
      if (token.email) {
        await connectDB();
        const dbUser = await User.findOne({
          email: token.email,
          role: "expert",
        });

        if (dbUser) {
          if (dbUser.isBanned) return null;

          token.id = dbUser._id.toString();
          token.picture = dbUser.image;
          token.role = dbUser.role;
        }
      }

      return token;
    },

    // ------------------------------------------------
    // SESSION CALLBACK
    // ------------------------------------------------
    async session({ session, token }) {
      if (!token) return null;

      session.user.id = token.id;
      session.user.image = token.picture;
      session.user.role = token.role;

      return session;
    },
  },

  session: { strategy: "jwt" },

  secret: process.env.NEXTAUTH_SECRET,

  pages: { signIn: "/login" },
};
