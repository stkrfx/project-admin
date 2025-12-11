/*
 * File: src/models/ExpertProfile.js
 * Description: Expert Business Model with Draft Verification, Documents & Rejection Reason.
 */

import mongoose, { Schema } from "mongoose";

// ------------------------------------------------------------------
// SUB-SCHEMAS
// ------------------------------------------------------------------

const DocumentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    type: { type: String, required: true, enum: ["image", "pdf"] },
  },
  { _id: false }
);

const ReviewSchema = new Schema({
  reviewerName: { type: String, required: true, trim: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 2000 },
  date: { type: Date, default: Date.now },
});

const ServiceSchema = new Schema({
  name: { type: String, required: true, trim: true },
  duration: { type: Number, required: true, min: 15 },
  type: { type: String, enum: ["video", "clinic", "chat", "phone"], required: true },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "AUD" },
  description: { type: String, maxlength: 300 },
});

const AvailabilitySlotSchema = new Schema(
  {
    dayOfWeek: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

// ------------------------------------------------------------------
// MAIN SCHEMA
// ------------------------------------------------------------------

const ExpertProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null, index: true },

    // -------------------------------
    // LIVE DATA
    // -------------------------------
    bio: { type: String, trim: true, maxlength: 2000, default: "" },
    specialization: { type: String, trim: true, default: "", index: true },
    timezone: { type: String, default: "Australia/Sydney" },
    startingPrice: { type: Number, default: 0, index: true },
    experienceYears: { type: Number, min: 0, default: 0 },
    consultationModes: { type: [String], default: [], index: true },
    education: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    gender: { type: String, enum: ["Male", "Female", "Non-Binary", "Prefer not to say", ""], default: "" },
    languages: { type: [String], default: [] },
    tags: { type: [String], default: [], index: true },
    socialLinks: { linkedin: String, twitter: String, website: String },

    // -------------------------------
    // DRAFT DATA (Including Documents)
    // -------------------------------
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
      socialLinks: { linkedin: String, twitter: String, website: String },

      // Draft documents (NEW)
      documents: [DocumentSchema],
    },

    // -------------------------------
    // FLAGS (Updated to include rejectionReason)
    // -------------------------------
    hasPendingUpdates: { type: Boolean, default: false }, // Yellow
    isVetted: { type: Boolean, default: false },          // Green
    isOnboarded: { type: Boolean, default: false },       // Fresh signup

    // NEW: Red state → Admin rejected profile
    rejectionReason: { type: String, default: null },

    // -------------------------------
    // COMPLEX DATA
    // -------------------------------
    documents: { type: [DocumentSchema], default: [] }, // Live verified documents
    reviews: { type: [ReviewSchema], default: [] },
    services: { type: [ServiceSchema], default: [] },
    availability: { type: [AvailabilitySlotSchema], default: [] },

    // -------------------------------
    // STATUS
    // -------------------------------
    isOnline: { type: Boolean, default: false, index: true },
    lastSeen: { type: Date, default: Date.now },
    rating: { type: Number, default: 0, min: 0, max: 5, index: true },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "expert_profiles" }
);

// ------------------------------------------------------------------
// HOOKS
// ------------------------------------------------------------------

ExpertProfileSchema.pre("save", function (next) {
  // Compute startingPrice + consultation modes from services
  if (this.services && this.services.length > 0) {
    const minPrice = Math.min(...this.services.map((s) => s.price));
    this.startingPrice = minPrice;

    const modes = new Set(this.services.map((s) => s.type));
    this.consultationModes = Array.from(modes);
  } else {
    this.startingPrice = 0;
    this.consultationModes = [];
  }

  next();
});

// ------------------------------------------------------------------

export default mongoose.models.ExpertProfile ||
  mongoose.model("ExpertProfile", ExpertProfileSchema);
