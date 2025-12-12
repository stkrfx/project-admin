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
  // Identity
  name: z.string().min(2, "Name is required"),
  username: z.string().min(3, "Username must be 3+ chars").regex(/^[a-z0-9]+$/, "Lowercase alphanumeric only"),
  gender: z.string().optional(),
  location: z.string().optional(),
  
  // Professional
  specialization: z.string().min(2, "Headline is required"),
  bio: z.string().min(50, "Bio must be at least 50 characters"),
  
  // Complex Fields
  workHistory: z.array(z.any()).optional(),
  education: z.array(z.any()).optional(),
  services: z.array(z.any()).optional(),
  languages: z.array(z.any()).optional(),
  tags: z.array(z.any()).optional(),
  documents: z.array(z.any()).optional(),
  
  // Availability
  availability: z.array(z.any()).optional(),
  leaves: z.array(z.any()).optional(),
  
  // Social
  linkedin: z.string().optional().or(z.literal("")),
  twitter: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
});

export async function getProfile() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    // FIX: ATOMIC UPSERT (Find or Create in one go)
    let profile = await ExpertProfile.findOneAndUpdate(
      { user: session.user.id },
      { 
        $setOnInsert: { 
          isOnboarded: false,
          user: session.user.id 
        } 
      },
      { 
        upsert: true, 
        new: true, // Return the new document
        setDefaultsOnInsert: true 
      }
    ).populate("user", "name email image username");

    // JIT: Apply Future Availability
    if (profile.futureAvailability?.validFrom && new Date() >= profile.futureAvailability.validFrom) {
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

export async function updateProfile(prevState, formData) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    // 1. Parse Data
    const parseJSON = (key) => {
        try { return JSON.parse(formData.get(key) || "[]"); } catch { return []; }
    };

    const rawData = {
        name: formData.get("name"),
        username: formData.get("username"),
        gender: formData.get("gender"),
        location: formData.get("location"),
        specialization: formData.get("specialization"),
        bio: formData.get("bio"),
        linkedin: formData.get("linkedin"),
        twitter: formData.get("twitter"),
        website: formData.get("website"),
        // JSON Arrays
        workHistory: parseJSON("workHistory"),
        education: parseJSON("education"),
        services: parseJSON("services"),
        languages: parseJSON("languages"),
        tags: parseJSON("tags"),
        documents: parseJSON("documents"),
        availability: parseJSON("availability"),
        leaves: parseJSON("leaves"),
    };

    // 2. Validate
    const validated = ProfileSchema.safeParse(rawData);
    
    if (!validated.success) {
        return { success: false, errors: validated.error.flatten().fieldErrors, message: "Please fix the errors highlighted." };
    }

    const data = validated.data;

    // 3. Check Username (Unique check excluding current user)
    // We still check against User model to reserve the slot, though strictly
    // we might want to check drafts too. For now, we check the live DB.
    if (data.username) {
      // Check live users table
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
  
      // ⭐ NEW: Check draft usernames of other expert profiles
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

    // [!code --] REMOVED: Immediate User Update
    // await User.findByIdAndUpdate(session.user.id, { 
    //    name: data.name, 
    //    username: data.username, 
    //    image: formData.get("image")
    // });

    // 4. Update Profile Model with ALL fields in Draft
    const updatePayload = {
        draft: {
            // [!code ++] Identity fields now go to Draft
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
            socialLinks: { linkedin: data.linkedin, twitter: data.twitter, website: data.website }
        },
        // Instant Updates (Availability logic)
        futureAvailability: {
            schedule: data.availability,
            leaves: data.leaves.map(l => ({ ...l, date: new Date(l.date) })),
            validFrom: new Date(new Date().setDate(new Date().getDate() + 1))
        },
        hasPendingUpdates: true,
        isOnboarded: true, // This might need admin approval too in a strict flow, but assuming onboarding is a state flag.
        rejectionReason: null
    };

    await ExpertProfile.findOneAndUpdate({ user: session.user.id }, { $set: updatePayload }, { upsert: true });

    revalidatePath("/profile");
    return { success: true, message: "Profile saved successfully." };

  } catch (error) {
    console.error("Update Profile Error:", error);
    return { success: false, message: "Something went wrong." };
  }
}