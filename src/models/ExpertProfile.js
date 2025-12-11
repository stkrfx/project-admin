import mongoose, { Schema } from "mongoose";

// --- SUB-SCHEMAS ---

const DocumentSchema = new Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  url: { type: String, required: true },
  fileType: { type: String, enum: ["image", "pdf"], required: true },
  fileSize: { type: String },
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
  company: { type: String, required: true },
  role: { type: String, required: true },
  location: String,
  startDate: { type: Date, required: true },
  endDate: { type: Date }, // Null if current
  current: { type: Boolean, default: false },
  description: String,
}, { _id: false });

// NEW: Structured Education
const EducationSchema = new Schema({
  institution: { type: String, required: true }, // College/University
  degree: { type: String, required: true },      // e.g. B.Sc, PhD
  fieldOfStudy: { type: String, required: true }, // e.g. Computer Science
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
    specialization: { type: String, trim: true, default: "", index: true },
    tags: { type: [String], default: [], index: true },
    
    // NEW: Structured Arrays
    workHistory: { type: [WorkHistorySchema], default: [] },
    education: { type: [EducationSchema], default: [] }, // Renamed from string to array
    
    // Calculated Fields (Read-Only mostly)
    experienceYears: { type: Number, min: 0, default: 0 },
    latestEducation: { type: String, default: "" }, // Formatted string for display

    // --- SERVICES & AVAILABILITY ---
    startingPrice: { type: Number, default: 0, index: true },
    consultationModes: { type: [String], default: [], index: true },
    services: { type: [ServiceSchema], default: [] },
    availability: { type: [AvailabilitySlotSchema], default: [] },
    leaves: { type: [LeaveSchema], default: [] },
    
    // Future Schedule bucket
    futureAvailability: {
        schedule: { type: [AvailabilitySlotSchema], default: [] },
        leaves: { type: [LeaveSchema], default: [] },
        validFrom: { type: Date, default: null }
    },

    // --- DRAFT BUCKET ---
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

  // 2. Auto-Calculate Experience Years
  // We check both live 'workHistory' or 'draft.workHistory' depending on which one is being saved/promoted
  // For safety, we usually calculate based on what will be LIVE. 
  // If this is a draft save, we might skip this, but let's calculate it based on the LIVE data for now.
  if (this.workHistory && this.workHistory.length > 0) {
    let totalMonths = 0;
    this.workHistory.forEach(job => {
        const start = new Date(job.startDate);
        const end = job.current ? new Date() : (job.endDate ? new Date(job.endDate) : new Date());
        
        // Simple month difference
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        if (months > 0) totalMonths += months;
    });
    this.experienceYears = Math.floor(totalMonths / 12);
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