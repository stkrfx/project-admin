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
     * CREDENTIALS PROVIDER
     * ---------------------------------------------------- */
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" },
        password: { label: "Password", type: "password" },
        type: { label: "Type", type: "text" }, // password | otp
      },

      async authorize(credentials) {
        if (!credentials?.email) throw new Error("Invalid email or password.");

        const { email, password, otp, type } = credentials;
        const normalizedEmail = email.trim().toLowerCase();

        /* ----------------------------------------------------
         * RATE LIMIT LOGIN ATTEMPTS
         * ---------------------------------------------------- */
        const { success } = await authRateLimit.limit(normalizedEmail);
        if (!success) {
          throw new Error("Too many login attempts. Try again later.");
        }

        await connectDB();

        /* ----------------------------------------------------
         * LOOKUP USER (NO ENUMERATION)
         * ---------------------------------------------------- */
        const user = await User.findOne({
          email: normalizedEmail,
          role: "expert",
        }).select("+password +otp +otpExpiry +tokenVersion");

        if (!user || user.isBanned) {
          throw new Error("Invalid email or password.");
        }

        /* ----------------------------------------------------
         * STRICT LOGIC SEPARATION
         * type MUST be either "password" or "otp"
         * ---------------------------------------------------- */

        /* -----------------------------------------
         * CASE A — OTP LOGIN
         * ----------------------------------------- */
        if (type === "otp") {
          if (!otp || !user.otp || !user.otpExpiry) {
            throw new Error("Invalid verification code.");
          }

          const validOtp = await bcrypt.compare(otp, user.otp);
          if (!validOtp) throw new Error("Invalid verification code.");

          if (user.otpExpiry < new Date()) {
            throw new Error("Verification code expired.");
          }

          // Success
          user.isVerified = true;
          user.otp = undefined;
          user.otpExpiry = undefined;
          user.tokenVersion = user.tokenVersion || 0;

          await user.save();
          return user;
        }

        /* -----------------------------------------
         * CASE B — PASSWORD LOGIN
         * ----------------------------------------- */
        if (type === "password") {
          if (!password || !user.password) {
            throw new Error("Invalid email or password.");
          }

          if (!user.isVerified) {
            throw new Error("Please verify your email first.");
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) throw new Error("Invalid email or password.");

          return user;
        }

        /* -----------------------------------------
         * FALLBACK — Invalid type
         * ----------------------------------------- */
        throw new Error("Invalid authentication method.");
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
        const normalizedEmail = user.email.trim().toLowerCase();

        let existingUser = await User.findOne({
          email: normalizedEmail,
          role: "expert",
        });

        if (existingUser) {
          if (existingUser.isBanned) return false;

          if (!existingUser.googleId) {
            existingUser.googleId = profile.sub;
          }

          const isGeneric =
            !existingUser.image ||
            existingUser.image.includes("ui-avatars.com");

          if (isGeneric && profile.picture) {
            existingUser.image = profile.picture;
          }

          if (!existingUser.isVerified) {
            existingUser.isVerified = true;
          }

          existingUser.tokenVersion = existingUser.tokenVersion || 0;
          await existingUser.save();

          return true;
        }

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
          tokenVersion: 0,
        });

        return true;
      } catch (err) {
        console.error("Google Sign-In Error:", err);
        return false;
      }
    },

    /* ----------------------------------------------------
     * JWT CALLBACK — TOKEN VERSION VALIDATION
     * ---------------------------------------------------- */
    async jwt({ token, user, account, trigger, session }) {
      // FIRST SIGN-IN
      if (user) {
        token.id = user.id;
        token.picture = user.image;
        token.role = user.role;
        token.tokenVersion = user.tokenVersion || 0;

        if (account?.provider === "google") {
          await connectDB();
          const dbUser = await User.findOne({
            email: user.email.toLowerCase(),
          }).select("tokenVersion role");

          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
            token.tokenVersion = dbUser.tokenVersion || 0;
          }
        }
      }

      /* ----------------------------------------------------
       * VALIDATE TOKEN VERSION ON EVERY REQUEST
       * ---------------------------------------------------- */
      if (token?.id) {
        await connectDB();
        const dbUser = await User.findById(token.id)
          .select("tokenVersion isBanned")
          .lean();

        if (!dbUser) return null;
        if (dbUser.isBanned) return null;

        // Invalidate old JWT after password reset / forced logout
        if ((dbUser.tokenVersion || 0) !== (token.tokenVersion || 0)) {
          return null;
        }
      }

      return token;
    },

    /* ----------------------------------------------------
     * SESSION CALLBACK — NO DB LOOKUPS (FAST)
     * ---------------------------------------------------- */
    async session({ session, token }) {
      if (!token) return session;

      session.user.id = token.id;
      session.user.role = token.role;
      session.user.image = token.picture;
      session.user.tokenVersion = token.tokenVersion;

      return session;
    },
  },

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
};
