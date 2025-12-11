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
      // REMOVED: unique: true (We allow duplicates if roles are different)
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
    
    // --- ROLE IS NOW PART OF THE UNIQUE IDENTITY ---
    role: {
      type: String,
      enum: ["user", "expert", "organisation", "admin"],
      required: true,
    },

    // Auth Fields
    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    isVerified: { type: Boolean, default: false },
    provider: { type: String, default: "credentials" },
    googleId: { type: String, select: false },

    // Ban & Security
    isBanned: { type: Boolean, default: false },
    banReason: { type: String },
    bannedAt: { type: Date },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
  },
  { timestamps: true }
);

// --- THE FIX: COMPOUND UNIQUE INDEX ---
// This ensures 'john@gmail.com' can exist ONCE as 'expert' and ONCE as 'user'
UserSchema.index({ email: 1, role: 1 }, { unique: true });

// Virtual Link
UserSchema.virtual('expertProfile', {
  ref: 'ExpertProfile',
  localField: '_id',
  foreignField: 'user',
  justOne: true
});

export default mongoose.models.User || mongoose.model("User", UserSchema);