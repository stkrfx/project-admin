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
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
      },

      async authorize(credentials) {
        if (!credentials?.email)
          throw new Error("Invalid email or password.");

        const email = credentials.email.trim().toLowerCase();

        // Rate limit login attempts
        const { success } = await authRateLimit.limit(email);
        if (!success)
          throw new Error("Too many login attempts. Try again later.");

        await connectDB();

        // Do not reveal if user exists
        const user = await User.findOne({
          email,
          role: "expert",
        }).select("+password +otp +otpExpiry +tokenVersion");

        if (!user) throw new Error("Invalid email or password.");
        if (user.isBanned) throw new Error("Invalid email or password.");

        /* -----------------------------
         * OTP LOGIN
         * ----------------------------- */
        if (credentials.otp) {
          if (!user.otp || !user.otpExpiry)
            throw new Error("Invalid email or password.");

          const isValidOtp = await bcrypt.compare(credentials.otp, user.otp);
          if (!isValidOtp)
            throw new Error("Invalid email or password.");

          if (user.otpExpiry < new Date())
            throw new Error("Invalid email or password.");

          user.isVerified = true;
          user.otp = undefined;
          user.otpExpiry = undefined;

          // IMPORTANT: attach tokenVersion
          user.tokenVersion = user.tokenVersion || 0;

          await user.save();
          return user;
        }

        /* -----------------------------
         * PASSWORD LOGIN
         * ----------------------------- */
        if (credentials.password) {
          if (!user.password)
            throw new Error("Invalid email or password.");

          if (!user.isVerified)
            throw new Error("Invalid email or password.");

          const isMatch = await bcrypt.compare(credentials.password, user.password);
          if (!isMatch)
            throw new Error("Invalid email or password.");

          return user;
        }

        throw new Error("Invalid email or password.");
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

          if (!existingUser.googleId)
            existingUser.googleId = profile.sub;

          const isGeneric =
            !existingUser.image ||
            existingUser.image.includes("ui-avatars.com");

          if (isGeneric && profile.picture)
            existingUser.image = profile.picture;

          if (!existingUser.isVerified)
            existingUser.isVerified = true;

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
     * JWT CALLBACK — carries tokenVersion
     * ---------------------------------------------------- */
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.picture = user.image;
        token.role = user.role;
        token.tokenVersion = user.tokenVersion || 0;

        // Fix Google ID mapping to valid MongoDB _id
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

      return token;
    },

    /* ----------------------------------------------------
     * SESSION CALLBACK — NO MORE DB LOOKUPS (FAST)
     * ---------------------------------------------------- */
    async session({ session, token }) {
      if (!token) return session;

      // No DB query → all trust comes from JWT
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.image = token.picture;

      // tokenVersion included but validated by middleware
      session.user.tokenVersion = token.tokenVersion;

      return session;
    },
  },

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
};
