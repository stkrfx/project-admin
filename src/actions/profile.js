"use server";

import connectDB from "@/lib/db";
import ExpertProfile from "@/models/ExpertProfile";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- 1. DEFINE VALIDATION SCHEMAS ---

const WorkHistorySchema = z.object({
  company: z.string().min(1, "Company name is required"),
  role: z.string().min(1, "Role is required"),
  startDate: z.coerce.date({ invalid_type_error: "Start date is invalid" }),
  endDate: z.coerce.date().nullable().optional(),
  current: z.boolean().optional(),
}).refine((data) => data.current || data.endDate, {
  message: "End date is required for past jobs",
  path: ["endDate"],
});

const EducationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  fieldOfStudy: z.string().min(1, "Field of study is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
});

const ServiceSchema = z.object({
  name: z.string().min(2, "Service name is too short"),
  duration: z.coerce.number().min(15, "Duration must be at least 15 min"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  type: z.enum(["video", "clinic", "chat", "phone"]),
  currency: z.string().default("AUD"),
  description: z.string().max(500, "Description too long").optional().or(z.literal("")),
});

// Main Profile Schema
const ProfileUpdateSchema = z.object({
  // Identity
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters")
    .regex(/^[a-z0-9]+$/, "Username must be lowercase alphanumeric"),
  gender: z.enum(["Male", "Female", "Non-Binary", "Prefer not to say", ""]).optional(),
  location: z.string().max(100).optional(),
  
  // Professional
  bio: z.string().max(2000, "Bio cannot exceed 2000 characters").optional(),
  specialization: z.string().max(100, "Headline is too long").optional(),
  experienceYears: z.coerce.number().min(0).default(0),
  
  // Arrays
  workHistory: z.array(WorkHistorySchema).optional(),
  education: z.array(EducationSchema).optional(),
  services: z.array(ServiceSchema).optional(),
  languages: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  
  // Objects
  documents: z.array(z.any()).optional(), // Document structure validated loosely or via sub-schema
  socialLinks: z.object({
    linkedin: z.string().optional().or(z.literal("")),
    twitter: z.string().optional().or(z.literal("")),
    website: z.string().optional().or(z.literal("")),
  }).optional(),
  
  // Availability
  availability: z.array(z.object({
    dayOfWeek: z.string(),
    startTime: z.string(),
    endTime: z.string()
  })).optional(),
  leaves: z.array(z.object({
    date: z.coerce.date(),
    isRecurring: z.boolean(),
    note: z.string().optional()
  })).optional()
});


// --- HELPER: TOMORROW DATE ---
const getTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
};

// --- READ ACTION ---
export async function getProfile() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    let profile = await ExpertProfile.findOne({ user: session.user.id })
      .populate("user", "name email image username isVerified");

    if (!profile) {
      profile = await ExpertProfile.create({
        user: session.user.id,
        isOnboarded: false,
        timezone: "Australia/Sydney",
      });
      profile = await ExpertProfile.findById(profile._id)
        .populate("user", "name email image username isVerified");
    }

    // JIT: Apply Future Availability
    if (profile.futureAvailability?.validFrom && new Date() >= profile.futureAvailability.validFrom) {
        console.log(`⚡ Applying Scheduled Availability for ${session.user.email}`);
        profile.availability = profile.futureAvailability.schedule;
        profile.leaves = profile.futureAvailability.leaves;
        profile.futureAvailability = { schedule: [], leaves: [], validFrom: null };
        await profile.save();
    }

    return JSON.parse(JSON.stringify(profile));
  } catch (error) {
    console.error("Get Profile Error:", error);
    return null;
  }
}

// --- WRITE ACTION ---
export async function updateProfile(formData) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "Unauthorized" };

    // 1. EXTRACT & PARSE RAW DATA
    const parseJSON = (key) => {
        try {
            const val = formData.get(key);
            return val ? JSON.parse(val) : [];
        } catch { return []; }
    };

    const rawData = {
        name: formData.get("name"),
        username: formData.get("username"),
        gender: formData.get("gender"),
        location: formData.get("location"),
        bio: formData.get("bio"),
        specialization: formData.get("specialization"),
        experienceYears: formData.get("experienceYears"),
        
        workHistory: parseJSON("workHistory"),
        education: parseJSON("education"),
        services: parseJSON("services"),
        languages: parseJSON("languages"),
        tags: parseJSON("tags"),
        documents: parseJSON("documents"),
        availability: parseJSON("availability"),
        leaves: parseJSON("leaves"),
        
        socialLinks: {
            linkedin: formData.get("linkedin"),
            twitter: formData.get("twitter"),
            website: formData.get("website"),
        }
    };

    // 2. VALIDATE DATA
    const validation = ProfileUpdateSchema.safeParse(rawData);

    if (!validation.success) {
        // Return the first validation error message
        const firstError = validation.error.issues[0];
        return { error: `${firstError.path.join('.')}: ${firstError.message}` };
    }

    const data = validation.data;

    // 3. IDENTITY UPDATES (User Model)
    // Check username uniqueness if changed
    if (data.username) {
        const existingUser = await User.findOne({ username: data.username, _id: { $ne: session.user.id } });
        if (existingUser) return { error: "Username is already taken." };
    }
    
    const image = formData.get("image"); // Image URL usually trusted from uploadthing
    await User.findByIdAndUpdate(session.user.id, { 
        name: data.name, 
        username: data.username, 
        image 
    });

    // 4. PREPARE UPDATES
    // Instant Updates (Availability) -> Future Bucket
    const futureUpdate = {
        futureAvailability: {
            schedule: data.availability,
            leaves: data.leaves,
            validFrom: getTomorrow() 
        }
    };

    // Draft Updates (Profile Content) -> Draft Bucket
    const draftUpdates = {
      bio: data.bio,
      specialization: data.specialization,
      gender: data.gender,
      location: data.location,
      experienceYears: data.experienceYears,
      timezone: formData.get("timezone"), // Not strictly validated yet

      workHistory: data.workHistory,
      education: data.education,
      languages: data.languages,
      tags: data.tags,
      services: data.services,
      documents: data.documents,
      socialLinks: data.socialLinks,
    };

    // 5. SAVE TO DB
    await ExpertProfile.findOneAndUpdate(
      { user: session.user.id },
      {
        $set: {
          ...futureUpdate,
          draft: draftUpdates,
          hasPendingUpdates: true,
          isOnboarded: true,
          rejectionReason: null, 
        }
      },
      { new: true, upsert: true }
    );

    revalidatePath("/profile");
    return { success: "Profile submitted for verification." };

  } catch (error) {
    console.error("Update Profile Error:", error);
    return { error: "Failed to save profile. Please try again." };
  }
}