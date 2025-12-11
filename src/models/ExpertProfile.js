/*
 * File: src/models/ExpertProfile.js
 */

import mongoose, { Schema } from "mongoose";

// --- SUB-SCHEMAS ---

const DocumentSchema = new Schema({
  title: { type: String, required: true, trim: true },
  url: { type: String, required: true },
  type: { type: String, enum: ["image", "pdf"], required: true },
}, { _id: false });

const ServiceSchema = new Schema({
  name: { type: String, required: true, trim: true }, 
  duration: { type: Number, required: true, min: 15 }, 
  type: { type: String, enum: ["video", "clinic", "chat", "phone"], required: true },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "AUD" },
  description: { type: String, maxlength: 500 },
});

// Strict Time Validation
const TIME_REGEX = /^([0-1]\d|2[0-3]):([0-5]\d)$/;

const AvailabilitySlotSchema = new Schema({
  dayOfWeek: { type: String, required: true },
  startTime: { type: String, required: true, match: TIME_REGEX },
  endTime: { type: String, required: true, match: TIME_REGEX },
}, { _id: false });

// Advanced Leave Schema
const LeaveSchema = new Schema({
  date: { type: Date, required: true }, 
  isRecurring: { type: Boolean, default: false }, // true = Annual, false = One-time
  note: { type: String, maxlength: 100 },
}, { _id: false });

// --- MAIN SCHEMA ---

const ExpertProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    
    // --- 1. LIVE DATA (Active Now) ---
    bio: { type: String, trim: true, default: "" },
    specialization: { type: String, trim: true, default: "" },
    timezone: { type: String, default: "Australia/Sydney" },
    startingPrice: { type: Number, default: 0, index: true },
    consultationModes: { type: [String], default: [], index: true },
    experienceYears: { type: Number, min: 0, default: 0 },
    education: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    gender: { type: String, default: "" },
    languages: { type: [String], default: [] },
    tags: { type: [String], default: [], index: true },
    socialLinks: { linkedin: String, twitter: String, website: String },

    // --- 2. ACTIVE SCHEDULE (Used for Today) ---
    availability: { type: [AvailabilitySlotSchema], default: [] },
    leaves: { type: [LeaveSchema], default: [] }, 

    // --- 3. FUTURE SCHEDULE (Action from Next Day) ---
    // If this is set, it overrides 'availability' AFTER 'validFrom' date
    futureAvailability: {
        schedule: { type: [AvailabilitySlotSchema], default: [] },
        leaves: { type: [LeaveSchema], default: [] },
        validFrom: { type: Date, default: null } // Usually set to Tomorrow 00:00
    },

    // --- 4. DRAFT DATA (For Content Verification) ---
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
      documents: [DocumentSchema],
      services: [ServiceSchema],
    },

    // --- FLAGS ---
    hasPendingUpdates: { type: Boolean, default: false },
    isVetted: { type: Boolean, default: false },
    isOnboarded: { type: Boolean, default: false },
    rejectionReason: { type: String, default: null },

    // --- COMPLEX DATA ---
    documents: { type: [DocumentSchema], default: [] },
    services: { type: [ServiceSchema], default: [] }, 

    // --- STATUS ---
    isOnline: { type: Boolean, default: false, index: true },
    lastSeen: { type: Date, default: Date.now },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "expert_profiles" }
);

ExpertProfileSchema.pre('save', function(next) {
  if (this.services && this.services.length > 0) {
    this.startingPrice = Math.min(...this.services.map(s => s.price));
    this.consultationModes = Array.from(new Set(this.services.map(s => s.type)));
  }
  next();
});

export default mongoose.models.ExpertProfile || mongoose.model("ExpertProfile", ExpertProfileSchema);