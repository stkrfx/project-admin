import mongoose, { Schema } from "mongoose";

// -------------------- SUB-SCHEMAS --------------------

// Documents (degree, license, certification)
const DocumentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    url: { type: String, required: true },
    fileType: { type: String, enum: ["image", "pdf"], required: true },
    fileSize: { type: String },
  },
  { _id: false }
);

// Services (Hybrid pricing: video + clinic)
const ServiceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    duration: { type: Number, required: true, min: 15 },

    videoPrice: { type: Number, min: 0, default: null },
    clinicPrice: { type: Number, min: 0, default: null },

    currency: { type: String, default: "AUD" },
    description: { type: String, maxlength: 500 },
  },
  { _id: false }
);

// Work history
const WorkHistorySchema = new Schema(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    current: { type: Boolean, default: false },
    description: { type: String, maxlength: 1000 },
  },
  { _id: false }
);

// Education
const EducationSchema = new Schema(
  {
    institution: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true },
    fieldOfStudy: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    current: { type: Boolean, default: false },
  },
  { _id: false }
);

// Weekly availability
const AvailabilitySlotSchema = new Schema(
  {
    dayOfWeek: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

// Leave days
const LeaveSchema = new Schema(
  {
    date: { type: Date, required: true },
    isRecurring: { type: Boolean, default: false },
    note: { type: String, maxlength: 100 },
  },
  { _id: false }
);

// -------------------- MAIN SCHEMA --------------------

const ExpertProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // -------------------- IDENTITY --------------------
    bio: { type: String, trim: true, maxlength: 2000, default: "" },
    introVideo: { type: String, default: "" }, // ⭐ NEW FIELD
    gender: {
      type: String,
      enum: ["Male", "Female", "Non-Binary", "Prefer not to say", ""],
      default: "",
    },
    location: { type: String, trim: true, default: "" },
    timezone: { type: String, default: "Australia/Sydney" },
    languages: { type: [String], default: [] },
    socialLinks: { linkedin: String, twitter: String, website: String },

    // -------------------- PROFESSIONAL --------------------
    specialization: { type: String, trim: true, default: "", index: true },
    tags: { type: [String], default: [], index: true },

    workHistory: { type: [WorkHistorySchema], default: [] },
    education: { type: [EducationSchema], default: [] },

    experienceYears: { type: Number, min: 0, default: 0 },
    latestEducation: { type: String, default: "" },

    // -------------------- SERVICES --------------------
    startingPrice: { type: Number, default: 0, index: true },
    consultationModes: { type: [String], default: [], index: true },
    services: { type: [ServiceSchema], default: [] },

    // -------------------- SCHEDULE --------------------
    availability: { type: [AvailabilitySlotSchema], default: [] },
    leaves: { type: [LeaveSchema], default: [] },

    futureAvailability: {
      schedule: { type: [AvailabilitySlotSchema], default: [] },
      leaves: { type: [LeaveSchema], default: [] },
      validFrom: { type: Date, default: null },
    },

    // -------------------- DRAFT (Admin Review) --------------------
    draft: {
      name: String,
      username: String,
      image: String,
      bio: String,
      introVideo: { type: String, default: "" }, // ⭐ NEW FIELD
      specialization: String,
      timezone: String,
      gender: String,
      location: String,

      languages: [String],
      tags: [String],
      workHistory: [WorkHistorySchema],
      education: [EducationSchema],
      socialLinks: { linkedin: String, twitter: String, website: String },
      documents: [DocumentSchema],
      services: [ServiceSchema],
    },

    // -------------------- FLAGS --------------------
    hasPendingUpdates: { type: Boolean, default: false },
    isVetted: { type: Boolean, default: false },
    isOnboarded: { type: Boolean, default: false },
    rejectionReason: { type: String, default: null },

    // -------------------- OTHER --------------------
    documents: { type: [DocumentSchema], default: [] },
    isOnline: { type: Boolean, default: false, index: true },
    lastSeen: { type: Date, default: Date.now },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "expert_profiles" }
);

// -------------------- PRE-SAVE HOOK --------------------

ExpertProfileSchema.pre("save", function (next) {
  // Calculate starting price & consultation modes
  if (this.services?.length) {
    const prices = [];
    const modes = new Set();

    this.services.forEach((s) => {
      if (s.videoPrice > 0) {
        prices.push(s.videoPrice);
        modes.add("video");
      }
      if (s.clinicPrice > 0) {
        prices.push(s.clinicPrice);
        modes.add("clinic");
      }
    });

    this.startingPrice = prices.length ? Math.min(...prices) : 0;
    this.consultationModes = Array.from(modes);
  } else {
    this.startingPrice = 0;
    this.consultationModes = [];
  }

  // Calculate experience years
  if (this.workHistory?.length) {
    const earliest = this.workHistory.reduce(
      (min, job) => (job.startDate < min ? job.startDate : min),
      new Date()
    );

    const now = new Date();
    const months =
      (now.getFullYear() - earliest.getFullYear()) * 12 +
      (now.getMonth() - earliest.getMonth());

    this.experienceYears = Math.max(0, Math.floor(months / 12));
  }

  // Latest education
  if (this.education?.length) {
    const sorted = [...this.education].sort((a, b) => {
      const endA = a.current ? new Date() : new Date(a.endDate || 0);
      const endB = b.current ? new Date() : new Date(b.endDate || 0);
      return endB - endA;
    });

    const latest = sorted[0];
    this.latestEducation = `${latest.degree} in ${latest.fieldOfStudy}`;
  }

  next();
});

export default mongoose.models.ExpertProfile ||
  mongoose.model("ExpertProfile", ExpertProfileSchema);
