import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      maxlength: [60, "Name cannot be more than 60 characters"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Please provide an email"],
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      select: false,
    },

    image: {
      type: String,
    },

    username: {
      type: String,
      trim: true,
    },

    // --- ROLE CONFIGURATION ---
    role: {
      type: String,
      enum: ["user", "expert", "organisation", "admin"],
      required: true,
    },

    // --- AUTH FIELDS ---
    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false },

    isVerified: { type: Boolean, default: false },

    provider: { type: String, default: "credentials" },
    googleId: { type: String, select: false },

    // ⭐ NEW FIELD — SESSION INVALIDATION SUPPORT
    tokenVersion: { type: Number, default: 0, select: false },

    // --- SECURITY & BANS ---
    isBanned: { type: Boolean, default: false },
    banReason: { type: String },
    bannedAt: { type: Date },

    // --- PASSWORD RESET ---
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
  },
  { timestamps: true }
);

// Unique email per role (expert vs user)
UserSchema.index({ email: 1, role: 1 }, { unique: true });

// Virtual Link to Profile
UserSchema.virtual("expertProfile", {
  ref: "ExpertProfile",
  localField: "_id",
  foreignField: "user",
  justOne: true,
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
