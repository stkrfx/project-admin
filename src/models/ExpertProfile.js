import mongoose, { Schema } from "mongoose";

// -----------------------------
// SUB-SCHEMAS
// -----------------------------

const DocumentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "pdf"], required: true },
  },
  { _id: false }
);

const ServiceSchema = new Schema({
  name: { type: String, required: true, trim: true },
  duration: { type: Number, required: true, min: 15 },
  type: {
    type: String,
    enum: ["video", "clinic", "chat", "phone"],
    required: true,
  },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "AUD" },
  description: { type: String, maxlength: 500 },
});

// Strict HH:MM validation
const TIME_REGEX = /^([0-1]\d|2[0-3]):([0-5]\d)$/;

const AvailabilitySlotSchema = new Schema(
  {
    dayOfWeek: {
      type: String,
      required: true,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
    startTime: { type: String, required: true, match: TIME_REGEX },
    endTime: { type: String, required: true, match: TIME_REGEX },
  },
  { _id: false }
);

// -----------------------------
// MAIN SCHEMA
// -----------------------------

const ExpertProfileSchema = new mongoose.Schema(
  {
    // Linking to User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // -----------------------------
    // LIVE PROFILE DATA
    // -----------------------------
    bio: { type: String, trim: true, maxlength: 2000, default: "" },
    specialization: { type: String, trim: true, default: "", index: true },
    timezone: { type: String, default: "Australia/Sydney" },
    startingPrice: { type: Number, default: 0, index: true },
    consultationModes: { type: [String], default: [], index: true },
    experienceYears: { type: Number, min: 0, default: 0 },
    education: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    gender: {
      type: String,
      enum: ["Male", "Female", "Non-Binary", "Prefer not to say", ""],
      default: "",
    },
    languages: { type: [String], default: [] },
    tags: { type: [String], default: [], index: true },
    socialLinks: {
      linkedin: String,
      twitter: String,
      website: String,
    },

    // Documents (Live)
    documents: { type: [DocumentSchema], default: [] },

    // Services (Live)
    services: { type: [ServiceSchema], default: [] },

    // Weekly Slots (Live)
    availability: { type: [AvailabilitySlotSchema], default: [] },

    // ⭐ NEW — Live Leaves (days OFF)
    leaves: { type: [Date], default: [] },

    // Reviews & Stats
    reviews: { type: [], default: [] },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: false, index: true },
    lastSeen: { type: Date, default: Date.now },

    // -----------------------------
    // DRAFT DATA (Pending Approval)
    // -----------------------------
    draft: {
      bio: String,
      specialization: String,
      timezone: String,
      experienceYears: Number,
      education: String,
      location: String,
      gender: String,

      languages: [String],
      tags: [String],

      socialLinks: {
        linkedin: String,
        twitter: String,
        website: String,
      },

      documents: [DocumentSchema],
      services: [ServiceSchema],
      availability: [AvailabilitySlotSchema],

      // ⭐ NEW — Leaves inside Draft
      leaves: [Date],
    },

    // -----------------------------
    // FLAGS
    // -----------------------------
    hasPendingUpdates: { type: Boolean, default: false },
    isVetted: { type: Boolean, default: false },
    isOnboarded: { type: Boolean, default: false },
    rejectionReason: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: "expert_profiles",
  }
);

// -----------------------------
// PRE-SAVE HOOK
// -----------------------------

ExpertProfileSchema.pre("save", function (next) {
  if (this.services?.length > 0) {
    this.startingPrice = Math.min(...this.services.map((s) => s.price));
    this.consultationModes = [
      ...new Set(this.services.map((s) => s.type)),
    ];
  } else {
    this.startingPrice = 0;
    this.consultationModes = [];
  }
  next();
});

// -----------------------------
export default mongoose.models.ExpertProfile ||
  mongoose.model("ExpertProfile", ExpertProfileSchema);
