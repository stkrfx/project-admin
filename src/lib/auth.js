import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { generateFromEmail } from "unique-username-generator";
import { authRateLimit } from "@/lib/limiter";

export const authOptions = {
  providers: [
    /* ----------------------------------------------------
     * GOOGLE PROVIDER
     * ---------------------------------------------------- */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    /* ----------------------------------------------------
     * CREDENTIALS (Email + Password + OTP)
     * ---------------------------------------------------- */
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
      },

      async authorize(credentials) {
        if (!credentials?.email) throw new Error("Email required.");

        // ✅ Normalize input email ALWAYS
        const email = credentials.email.trim().toLowerCase();

        // 🔥 Rate limit brute forcing
        const { success } = await authRateLimit.limit(email);
        if (!success) throw new Error("Too many login attempts. Try again later.");

        await connectDB();

        // Look up expert by email
        const user = await User.findOne({
          email,
          role: "expert",
        }).select("+password +otp +otpExpiry");

        if (!user) throw new Error("No expert account found. Please register.");
        if (user.isBanned) throw new Error("This account has been suspended.");

        /* ----------------------------------------------------
         * OTP LOGIN FLOW
         * ---------------------------------------------------- */
        if (credentials.otp) {
          if (!user.otp || !user.otpExpiry)
            throw new Error("No OTP issued. Please request a new one.");

          const isValidOtp = await bcrypt.compare(credentials.otp, user.otp);
          if (!isValidOtp) throw new Error("Invalid OTP");

          if (user.otpExpiry < new Date())
            throw new Error("OTP has expired. Please request a new one.");

          user.isVerified = true;
          user.otp = undefined;
          user.otpExpiry = undefined;
          await user.save();

          return user;
        }

        /* ----------------------------------------------------
         * PASSWORD LOGIN FLOW
         * ---------------------------------------------------- */
        if (credentials.password) {
          if (!user.password)
            throw new Error("Please login with Google or reset your password.");

          if (!user.isVerified)
            throw new Error("Please verify your email first.");

          const isMatch = await bcrypt.compare(credentials.password, user.password);
          if (!isMatch) throw new Error("Invalid credentials");

          return user;
        }

        throw new Error("Invalid login attempt.");
      },
    }),
  ],

  /* ----------------------------------------------------
   * CALLBACKS
   * ---------------------------------------------------- */
  callbacks: {
    /* ----------------------------------------------------
     * GOOGLE SIGN-IN
     * ---------------------------------------------------- */
    async signIn({ user, account, profile }) {
      if (account.provider !== "google") return true;

      try {
        await connectDB();

        const normalizedEmail = (user.email || "").trim().toLowerCase();

        let existingUser = await User.findOne({
          email: normalizedEmail,
          role: "expert",
        });

        if (existingUser) {
          if (existingUser.isBanned) return false;

          // Link Google ID if missing
          if (!existingUser.googleId) existingUser.googleId = profile.sub;

          // Replace generic Avatar if needed
          const isGeneric =
            !existingUser.image ||
            existingUser.image.includes("ui-avatars.com");

          if (isGeneric && profile.picture) {
            existingUser.image = profile.picture;
          }

          if (!existingUser.isVerified) existingUser.isVerified = true;
          await existingUser.save();
          return true;
        }

        // Create BRAND NEW user
        const username = generateFromEmail(normalizedEmail, 3);

        await User.create({
          name: user.name,
          email: normalizedEmail,
          image: user.image,
          username,
          role: "expert",
          provider: "google",
          googleId: profile.sub,
          isVerified: true,
        });

        return true;
      } catch (err) {
        console.error("Google Sign-In Error:", err);
        return false;
      }
    },

    /* ----------------------------------------------------
     * JWT CALLBACK (Fix Google ID → MongoDB ID)
     * ---------------------------------------------------- */
    async jwt({ token, user, account, trigger, session }) {
      // First sign-in
      if (user) {
        token.id = user.id;
        token.picture = user.image;
        token.role = user.role;

        // FIX: Google returns invalid `id`, so fetch real ID from DB
        if (account?.provider === "google") {
          await connectDB();
          const dbUser = await User.findOne({
            email: user.email.toLowerCase(),
          });

          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
          }
        }
      }

      // Profile updated
      if (trigger === "update" && session) {
        token.name = session.user.name;
        token.email = session.user.email;
        token.picture = session.user.image;
      }

      return token;
    },

    /* ----------------------------------------------------
     * SESSION CALLBACK — prevents banned/invalid users
     * ---------------------------------------------------- */
    async session({ session, token }) {
      if (!token) return session;

      await connectDB();

      const currentUser = await User.findById(token.id).select(
        "isBanned isVerified"
      );

      if (!currentUser || currentUser.isBanned || !currentUser.isVerified) {
        return null;
      }

      session.user.id = token.id;
      session.user.image = token.picture;
      session.user.role = token.role;

      return session;
    },
  },

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/login",
  },
};
