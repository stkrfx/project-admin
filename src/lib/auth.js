import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { generateFromEmail } from "unique-username-generator"; 

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        await connectDB();

        if (!credentials?.email) {
           throw new Error("Missing email");
        }

        // Select password explicitly because it's hidden by default in the model
        const user = await User.findOne({ email: credentials.email }).select("+password");

        if (!user) {
          throw new Error("User not found");
        }

        // --- SCENARIO 1: OTP LOGIN (Verification & Auto-Login Flow) ---
        if (credentials.otp) {
          if (user.otp !== credentials.otp) throw new Error("Invalid OTP");
          if (user.otpExpiry < new Date()) throw new Error("OTP has expired");

          // Verify user and clear OTP fields
          user.isVerified = true;
          user.otp = undefined;
          user.otpExpiry = undefined;
          await user.save();

          return { id: user._id.toString(), name: user.name, email: user.email, image: user.image };
        }

        // --- SCENARIO 2: PASSWORD LOGIN (Standard Flow) ---
        if (credentials.password) {
          if (!user.isVerified) throw new Error("Please verify your email first.");

          const isMatch = await bcrypt.compare(credentials.password, user.password);
          if (!isMatch) throw new Error("Invalid email or password");

          return { id: user._id.toString(), name: user.name, email: user.email, image: user.image };
        }

        throw new Error("Invalid credentials");
      },
    }),
  ],
  callbacks: {
    // 1. SIGN IN CALLBACK: The Smart Sync & Auto-Registration
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        try {
          await connectDB();
          
          const existingUser = await User.findOne({ email: user.email });

          if (existingUser) {
            // A) User exists: Sync their image if it's missing or generic (ui-avatars)
            const isGenericImage = !existingUser.image || existingUser.image.includes("ui-avatars.com");
            
            if (isGenericImage && profile.picture) {
              existingUser.image = profile.picture;
            }
            
            // Google accounts are inherently verified
            if (!existingUser.isVerified) {
              existingUser.isVerified = true;
            }
            
            await existingUser.save();
            return true; // Allow login
          } 
          
          // B) User DOES NOT exist: Auto-Register them
          else {
            const username = generateFromEmail(user.email, 3); // Create unique username
            
            await User.create({
              name: user.name,
              email: user.email,
              image: user.image, // Use Google image
              username: username,
              isVerified: true, // Google users are always verified
              provider: "google",
            });
            
            return true; // Allow login
          }
        } catch (error) {
          console.error("Google Sign-In Error:", error);
          return false; // Deny login on database error
        }
      }
      return true; // Allow other providers (Credentials) to pass
    },

    // 2. JWT CALLBACK: Persist DB ID & Revalidate Session
    async jwt({ token, user, trigger, session }) {
      // A) Initial Sign In
      if (user) {
        token.id = user.id;
        token.picture = user.image;
      }
      
      // B) Manual Client-Side Update
      if (trigger === "update" && session) {
        token.name = session.user.name;
        token.email = session.user.email;
        token.picture = session.user.image;
        return token;
      }
      
      // C) SUBSEQUENT VISITS (Session Sync)
      // This ensures that if the DB changes (e.g. image update), the session updates automatically
      // on the next page load, keeping multiple devices in sync.
      if (token.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email });
        
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.picture = dbUser.image; // Updates the image in the cookie
        }
      }
      
      return token;
    },

    // 3. SESSION CALLBACK: Pass data to the frontend
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};