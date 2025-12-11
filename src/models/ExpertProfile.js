import mongoose, { Schema } from "mongoose";

// --- SUB-SCHEMAS ---

const DocumentSchema = new Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true }, // e.g. "Degree", "License"
  url: { type: String, required: true },
  fileType: { type: String, enum: ["image", "pdf"], required: true },
  fileSize: { type: String }, // e.g. "2.5 MB"
}, { _id: false });

const ServiceSchema = new Schema({
  name: { type: String, required: true, trim: true }, 
  duration: { type: Number, required: true, min: 15 }, 
  type: { type: String, enum: ["video", "clinic", "chat", "phone"], required: true },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "AUD" },
  description: { type: String, maxlength: 500 },
}, { _id: false });

// NEW: Structured Work History
const WorkHistorySchema = new Schema({
  company: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  location: { type: String, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date }, // Null if current
  current: { type: Boolean, default: false },
  description: { type: String, maxlength: 1000 },
}, { _id: false });

// NEW: Structured Education
const EducationSchema = new Schema({
  institution: { type: String, required: true, trim: true }, 
  degree: { type: String, required: true, trim: true },      
  fieldOfStudy: { type: String, required: true, trim: true }, 
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  current: { type: Boolean, default: false },
}, { _id: false });

const AvailabilitySlotSchema = new Schema({
  dayOfWeek: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
}, { _id: false });

const LeaveSchema = new Schema({
  date: { type: Date, required: true }, 
  isRecurring: { type: Boolean, default: false },
  note: { type: String, maxlength: 100 },
}, { _id: false });

// --- MAIN SCHEMA ---

const ExpertProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    
    // --- IDENTITY & BIO ---
    bio: { type: String, trim: true, maxlength: 2000, default: "" },
    gender: { type: String, enum: ["Male", "Female", "Non-Binary", "Prefer not to say", ""], default: "" },
    location: { type: String, trim: true, default: "" },
    timezone: { type: String, default: "Australia/Sydney" },
    languages: { type: [String], default: [] },
    socialLinks: { linkedin: String, twitter: String, website: String },

    // --- PROFESSIONAL DATA ---
    specialization: { type: String, trim: true, default: "", index: true }, // Headline
    tags: { type: [String], default: [], index: true }, // Skills
    
    // NEW: Structured Arrays
    workHistory: { type: [WorkHistorySchema], default: [] },
    education: { type: [EducationSchema], default: [] }, 
    
    // Calculated Fields (Read-Only)
    experienceYears: { type: Number, min: 0, default: 0 },
    latestEducation: { type: String, default: "" }, // Formatted string for display cards

    // --- SERVICES & AVAILABILITY ---
    startingPrice: { type: Number, default: 0, index: true },
    consultationModes: { type: [String], default: [], index: true },
    services: { type: [ServiceSchema], default: [] },
    availability: { type: [AvailabilitySlotSchema], default: [] },
    leaves: { type: [LeaveSchema], default: [] },
    
    // Future Schedule Bucket (Apply from Next Day)
    futureAvailability: {
        schedule: { type: [AvailabilitySlotSchema], default: [] },
        leaves: { type: [LeaveSchema], default: [] },
        validFrom: { type: Date, default: null }
    },

    // --- DRAFT BUCKET (For Admin Verification) ---
    draft: {
      bio: String,
      specialization: String,
      timezone: String,
      gender: String,
      languages: [String],
      tags: [String],
      workHistory: [WorkHistorySchema],
      education: [EducationSchema],
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
    
    // --- METRICS ---
    isOnline: { type: Boolean, default: false, index: true },
    lastSeen: { type: Date, default: Date.now },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "expert_profiles" }
);

// --- INTELLIGENT SAVE HOOK ---
ExpertProfileSchema.pre('save', function(next) {
  
  // 1. Calculate Starting Price & Modes
  if (this.services && this.services.length > 0) {
    this.startingPrice = Math.min(...this.services.map(s => s.price));
    this.consultationModes = Array.from(new Set(this.services.map(s => s.type)));
  } else {
    this.startingPrice = 0;
    this.consultationModes = [];
  }

  // 2. Auto-Calculate Experience Years from Work History
  if (this.workHistory && this.workHistory.length > 0) {
    let totalMonths = 0;
    // Calculate overlap-aware experience would be complex, doing simple sum of durations for now
    // Ideally, sort by date and merge overlapping intervals.
    // For simplicity/robustness here: We calculate "Career Span" (Earliest Start to Present)
    const earliestStart = this.workHistory.reduce((min, job) => 
        job.startDate < min ? job.startDate : min, new Date()
    );
    const now = new Date();
    const spanMonths = (now.getFullYear() - earliestStart.getFullYear()) * 12 + (now.getMonth() - earliestStart.getMonth());
    
    this.experienceYears = Math.max(0, Math.floor(spanMonths / 12));
  }

  // 3. Auto-Derive Latest Education String
  if (this.education && this.education.length > 0) {
    // Sort by end date descending (newest first)
    const sortedEdu = [...this.education].sort((a, b) => {
        const dateA = a.current ? new Date() : new Date(a.endDate || 0);
        const dateB = b.current ? new Date() : new Date(b.endDate || 0);
        return dateB - dateA;
    });
    const latest = sortedEdu[0];
    this.latestEducation = `${latest.degree} in ${latest.fieldOfStudy}`;
  }

  next();
});

export default mongoose.models.ExpertProfile || mongoose.model("ExpertProfile", ExpertProfileSchema);