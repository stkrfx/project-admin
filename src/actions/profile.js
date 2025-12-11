"use server";

import connectDB from "@/lib/db";
import ExpertProfile from "@/models/ExpertProfile";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Helper: Get Tomorrow 00:00
const getTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
};

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

    // --- JIT SWAP LOGIC (Apply Future Availability) ---
    if (profile.futureAvailability?.validFrom && new Date() >= profile.futureAvailability.validFrom) {
        console.log("⚡ Applying Scheduled Availability Update...");
        
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

export async function updateProfile(formData) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) return { error: "Unauthorized" };

    // -----------------------------------------
    // 1️⃣ UPDATE BASIC USER FIELDS
    // -----------------------------------------
    const name = formData.get("name");
    const username = formData.get("username");
    const image = formData.get("image");

    if (name || username || image) {
      // Check username uniqueness if changed
      if (username) {
          const existingUser = await User.findOne({ username, _id: { $ne: session.user.id } });
          if (existingUser) return { error: "Username is already taken." };
      }
      await User.findByIdAndUpdate(session.user.id, { name, username, image });
    }

    // -----------------------------------------
    // 2️⃣ SAFE JSON PARSER
    // -----------------------------------------
    const safeParse = (key) => {
      try {
        const raw = formData.get(key);
        return raw ? JSON.parse(raw) : undefined;
      } catch {
        return [];
      }
    };

    // -----------------------------------------
    // 3️⃣ BUILD UPDATE OBJECTS
    // -----------------------------------------
    
    // A. INSTANT UPDATES (Availability - No Review Needed)
    // We save these to 'futureAvailability' to apply from tomorrow
    const instantUpdates = {
        futureAvailability: {
            schedule: safeParse("availability"),
            leaves: safeParse("leaves").map(l => ({
                date: new Date(l.date),
                isRecurring: l.isRecurring,
                note: l.note
            })),
            validFrom: getTomorrow() 
        }
    };

    // B. DRAFT UPDATES (Requires Verification)
    const draftUpdates = {
      // Basic Fields
      bio: formData.get("bio"),
      specialization: formData.get("specialization"),
      gender: formData.get("gender"),
      location: formData.get("location"),
      timezone: formData.get("timezone"),
      experienceYears: Number(formData.get("experienceYears")) || 0,

      // Arrays (Parsed from JSON strings)
      languages: safeParse("languages"),
      tags: safeParse("tags"),
      documents: safeParse("documents"),
      services: safeParse("services"),
      
      // FIX: Use safeParse for Education & Work History
      education: safeParse("education"),
      workHistory: safeParse("workHistory"),

      // Nested
      socialLinks: {
        linkedin: formData.get("linkedin"),
        twitter: formData.get("twitter"),
        website: formData.get("website"),
      },
    };

    // -----------------------------------------
    // 4️⃣ SAVE TO DB
    // -----------------------------------------
    await ExpertProfile.findOneAndUpdate(
      { user: session.user.id },
      {
        $set: {
          ...instantUpdates,       // Saves to future bucket
          draft: draftUpdates,     // Saves to draft bucket
          hasPendingUpdates: true, // Triggers Admin Review
          isOnboarded: true,
          rejectionReason: null,   // Clear previous rejection
        },
      },
      { new: true, upsert: true }
    );

    revalidatePath("/profile");
    return { success: "Profile submitted for verification." };

  } catch (error) {
    console.error("Update Profile Error:", error);
    return { error: "Failed to update profile." };
  }
}