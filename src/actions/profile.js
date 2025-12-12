"use server";

import connectDB from "@/lib/db";
import ExpertProfile from "@/models/ExpertProfile";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- VALIDATION SCHEMAS ---
const ProfileSchema = z.object({
  // -------------------------
  // Identity (ALL REQUIRED)
  // -------------------------
  image: z.string().min(1, "Profile picture is required"),
  name: z.string().min(2, "Name is required"),
  username: z
    .string()
    .min(3, "Username must be 3+ chars")
    .regex(/^[a-z0-9]+$/, "Lowercase alphanumeric only"),
  gender: z.string().min(1, "Gender is required"),
  location: z.string().min(2, "Location is required"),
  timezone: z.string().min(1, "Timezone is required"),

  // -------------------------
  // Professional
  // -------------------------
  specialization: z.string().min(2, "Headline is required"),
  bio: z.string().min(50, "Bio must be at least 50 characters"),

  // -------------------------
  // Complex Required Lists
  // -------------------------
  workHistory: z.array(z.any()).min(1, "Add at least one work experience"),
  education: z.array(z.any()).min(1, "Add at least one education"),
  services: z.array(z.any()).min(1, "Add at least one service"),
  languages: z.array(z.any()).min(1, "Add at least one language"),
  tags: z.array(z.any()).min(1, "Add at least one skill"),
  documents: z.array(z.any()).min(1, "Upload at least one document"),

  // -------------------------
  // Availability
  // -------------------------
  availability: z.array(z.any()).min(1, "Set your weekly schedule"),
  leaves: z.array(z.any()).optional(),

  // -------------------------
  // Social (Optional)
  // -------------------------
  linkedin: z.string().optional().or(z.literal("")),
  twitter: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
});


/* ============================================================================
 * GET PROFILE (with atomic upsert + future availability auto-apply)
 * ============================================================================
 */
export async function getProfile() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    let profile = await ExpertProfile.findOneAndUpdate(
      { user: session.user.id },
      {
        $setOnInsert: {
          isOnboarded: false,
          user: session.user.id,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    ).populate("user", "name email image username");

    // Auto-apply future availability if date has come
    if (
      profile.futureAvailability?.validFrom &&
      new Date() >= profile.futureAvailability.validFrom
    ) {
      profile.availability = profile.futureAvailability.schedule;
      profile.leaves = profile.futureAvailability.leaves;

      profile.futureAvailability = {
        schedule: [],
        leaves: [],
        validFrom: null,
      };

      await profile.save();
    }

    return JSON.parse(JSON.stringify(profile));
  } catch (error) {
    console.error("Get Profile Error:", error);
    return null;
  }
}

/* ============================================================================
 * UPDATE PROFILE (FINAL PATCHED VERSION)
 * ============================================================================
 */
export async function updateProfile(prevState, formData) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id)
      return { success: false, message: "Unauthorized" };

    // Parse dynamic JSON fields safely
    const parseJSON = (key) => {
      try {
        return JSON.parse(formData.get(key) || "[]");
      } catch {
        return [];
      }
    };

    // Collect raw form data
    const rawData = {
      // Identity
      image: formData.get("image"),
      name: formData.get("name"),
      username: formData.get("username"),
      gender: formData.get("gender"),
      location: formData.get("location"),
      timezone: formData.get("timezone"),
    
      // Professional
      specialization: formData.get("specialization"),
      bio: formData.get("bio"),
    
      // Complex Fields
      workHistory: parseJSON("workHistory"),
      education: parseJSON("education"),
      services: parseJSON("services"),
      languages: parseJSON("languages"),
      tags: parseJSON("tags"),
      documents: parseJSON("documents"),
    
      // Availability
      availability: parseJSON("availability"),
      leaves: parseJSON("leaves"),
    
      // Social
      linkedin: formData.get("linkedin"),
      twitter: formData.get("twitter"),
      website: formData.get("website"),
    };
    

    // Validate input
    const validated = ProfileSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors,
        message: "Please fix the errors highlighted.",
      };
    }

    const data = validated.data;

    /* -------------------------------------------------------------------------
     * USERNAME UNIQUENESS CHECK 
     * Against both:
     * 1. Users collection  
     * 2. Draft usernames in ExpertProfile
     * -------------------------------------------------------------------------
     */
    if (data.username) {
      // Live user table check
      const existingUser = await User.findOne({
        username: data.username,
        _id: { $ne: session.user.id },
      });

      if (existingUser) {
        return {
          success: false,
          errors: { username: ["Username is already taken"] },
          message: "Username taken",
        };
      }

      // Draft username check
      const existingDraft = await ExpertProfile.findOne({
        "draft.username": data.username,
        user: { $ne: session.user.id },
      });

      if (existingDraft) {
        return {
          success: false,
          errors: { username: ["Username is reserved by another expert"] },
          message: "Username already reserved by another user",
        };
      }
    }

    /* -------------------------------------------------------------------------
 * [REMOVED] STOP SYNCING MAIN USER RECORD
 * Identity changes will remain in draft until admin approval
 * -------------------------------------------------------------------------
 */
// await User.findByIdAndUpdate(session.user.id, {
//   name: data.name,
//   username: data.username,
//   image: formData.get("image"),
// });

    /* -------------------------------------------------------------------------
     * PREPARE PAYLOAD FOR DRAFT-BASED PROFILE UPDATE
     * Admin will approve later
     * -------------------------------------------------------------------------
     */
    const updatePayload = {
      draft: {
        name: data.name,
        username: data.username,
        image: formData.get("image"),

        bio: data.bio,
        specialization: data.specialization,
        gender: data.gender,
        location: data.location,
        workHistory: data.workHistory,
        education: data.education,
        languages: data.languages,
        tags: data.tags,
        services: data.services,
        documents: data.documents,
        socialLinks: {
          linkedin: data.linkedin,
          twitter: data.twitter,
          website: data.website,
        },
      },

      // Future availability applies next day
      futureAvailability: {
        schedule: data.availability,
        leaves: data.leaves.map((l) => ({
          ...l,
          date: new Date(l.date),
        })),
        validFrom: new Date(
          new Date().setDate(new Date().getDate() + 1)
        ),
      },

      hasPendingUpdates: true,
      isOnboarded: true,
      rejectionReason: null,
    };

    await ExpertProfile.findOneAndUpdate(
      { user: session.user.id },
      { $set: updatePayload },
      { upsert: true }
    );

    revalidatePath("/profile");
    return { success: true, message: "Profile saved successfully." };
  } catch (error) {
    console.error("Update Profile Error:", error);
    return { success: false, message: "Something went wrong." };
  }
}
