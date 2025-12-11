import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { generateFromEmail } from "unique-username-generator";
import { authRateLimit } from "@/lib/limiter";

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
        // 1. Rate Limit
        if (credentials?.email) {
          const { success } = await authRateLimit.limit(credentials.email);
          if (!success) throw new Error("Too many login attempts. Try again later.");
        }

        await connectDB();
        
        // 2. FIND EXPERT ACCOUNT
        // We strictly filter by role="expert" to prevent logging into a "User" account
        const user = await User.findOne({ 
          email: credentials.email, 
          role: "expert" 
        }).select("+password");

        if (!user) {
          throw new Error("No expert account found. Please register.");
        }

        // 3. BAN CHECK
        if (user.isBanned) {
          throw new Error("This account has been suspended.");
        }

        // --- OTP LOGIN FLOW (Registration / Verify) ---
        if (credentials.otp) {
          if (user.otp !== credentials.otp) throw new Error("Invalid OTP");
          if (user.otpExpiry < new Date()) throw new Error("OTP has expired");

          user.isVerified = true;
          user.otp = undefined;
          user.otpExpiry = undefined;
          await user.save();

          return user;
        }

        // --- PASSWORD LOGIN FLOW ---
        if (credentials.password) {
          // If user has no password (Google only), prompt them to reset/set one
          if (!user.password) {
             throw new Error("Please login with Google or reset your password.");
          }

          if (!user.isVerified) throw new Error("Please verify your email first.");
          
          const isMatch = await bcrypt.compare(credentials.password, user.password);
          if (!isMatch) throw new Error("Invalid credentials");

          return user;
        }

        throw new Error("Invalid credentials");
      },
    }),
  ],
  callbacks: {
    // 1. SIGN IN CALLBACK (The Linking Logic)
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        try {
          await connectDB();
          
          // Find existing EXPERT account
          const existingUser = await User.findOne({ 
            email: user.email, 
            role: "expert" 
          });

          if (existingUser) {
            if (existingUser.isBanned) return false;

            // --- LINKING LOGIC ---
            // If they didn't have a Google ID before, save it now.
            // This merges "Password Account" with "Google Login"
            if (!existingUser.googleId) {
                existingUser.googleId = profile.sub;
            }

            // Sync Image if generic
            const isGeneric = !existingUser.image || existingUser.image.includes("ui-avatars.com");
            if (isGeneric && profile.picture) {
                existingUser.image = profile.picture;
            }
            
            // Ensure verified
            if (!existingUser.isVerified) existingUser.isVerified = true;
            
            await existingUser.save();
            return true;
          } 
          
          // CREATE NEW EXPERT (Google First)
          else {
            const username = generateFromEmail(user.email, 3);
            await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              username: username,
              isVerified: true,
              role: "expert", // Force Expert Role
              provider: "google",
              googleId: profile.sub,
            });
            return true;
          }
        } catch (error) {
          console.error("Google Sign-In Error:", error);
          return false;
        }
      }
      return true;
    },

    // 2. JWT CALLBACK
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.picture = user.image;
        token.role = user.role;
      }
      
      if (trigger === "update" && session) {
        token.name = session.user.name;
        token.email = session.user.email;
        token.picture = session.user.image;
        return token;
      }

      // Session Revalidation
      if (token.email) {
        await connectDB();
        const dbUser = await User.findOne({ 
            email: token.email, 
            role: "expert" 
        });
        
        if (dbUser) {
           if (dbUser.isBanned) return null; // Log out banned users
           token.id = dbUser._id.toString();
           token.picture = dbUser.image;
           token.role = dbUser.role;
        }
      }
      return token;
    },

    // 3. SESSION CALLBACK
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.image = token.picture;
        session.user.role = token.role;
      } else {
        return null;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
};