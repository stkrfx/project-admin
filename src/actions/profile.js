"use server";

import connectDB from "@/lib/db";
import ExpertProfile from "@/models/ExpertProfile";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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

    // --- 1. DIRECT IDENTITY UPDATE ---
    const name = formData.get("name");
    const username = formData.get("username");
    const image = formData.get("image");

    if (name || username || image) {
        await User.findByIdAndUpdate(session.user.id, { name, username, image });
    }

    // --- 2. DRAFT PROFILE UPDATE ---
    // Helper: Safely parse JSON fields
    const safeParse = (key) => {
        try {
            return formData.get(key) ? JSON.parse(formData.get(key)) : undefined;
        } catch (e) {
            return [];
        }
    };

    const rawUpdates = {
      // Simple Fields
      bio: formData.get("bio"),
      specialization: formData.get("specialization"),
      education: formData.get("education"),
      location: formData.get("location"),
      timezone: formData.get("timezone"),
      gender: formData.get("gender"),
      
      // Numbers
      experienceYears: Number(formData.get("experienceYears")) || 0,
      
      // JSON Arrays (The "User Friendly" magic)
      languages: safeParse("languages"), // ["English", "Spanish"]
      tags: safeParse("tags"),           // ["CBT", "Anxiety"]
      services: safeParse("services"),   // [{ name: "Video", price: 50... }]
      availability: safeParse("availability"), // [{ day: "Monday", start: "09:00"... }]
      documents: safeParse("documents"),
      
      // Nested Objects
      socialLinks: {
        linkedin: formData.get("linkedin"),
        twitter: formData.get("twitter"),
        website: formData.get("website"),
      },
    };

    // Save to Draft
    await ExpertProfile.findOneAndUpdate(
      { user: session.user.id },
      {
        $set: {
          draft: rawUpdates,
          hasPendingUpdates: true,
          isOnboarded: true, 
        }
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