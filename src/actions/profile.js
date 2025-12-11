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

    // -----------------------------------------
    // 1️⃣ UPDATE BASIC USER FIELDS
    // -----------------------------------------
    const name = formData.get("name");
    const username = formData.get("username");
    const image = formData.get("image");

    if (name || username || image) {
      await User.findByIdAndUpdate(session.user.id, {
        name,
        username,
        image,
      });
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
    // 3️⃣ BUILD DRAFT UPDATE OBJECT
    // -----------------------------------------
    const rawUpdates = {
      // Basic fields
      bio: formData.get("bio"),
      specialization: formData.get("specialization"),
      education: formData.get("education"),
      location: formData.get("location"),
      timezone: formData.get("timezone"),
      gender: formData.get("gender"),

      experienceYears: Number(formData.get("experienceYears")) || 0,

      // Arrays
      languages: safeParse("languages"),
      tags: safeParse("tags"),
      services: safeParse("services"),
      availability: safeParse("availability"),
      documents: safeParse("documents"),

      // ⭐ NEW — Convert leaves[] into actual Date objects
      leaves: safeParse("leaves")?.map((d) => new Date(d)) || [],

      // Nested
      socialLinks: {
        linkedin: formData.get("linkedin"),
        twitter: formData.get("twitter"),
        website: formData.get("website"),
      },
    };

    // -----------------------------------------
    // 4️⃣ SAVE TO DRAFT + RESET REVIEW FLAGS
    // -----------------------------------------
    await ExpertProfile.findOneAndUpdate(
      { user: session.user.id },
      {
        $set: {
          draft: rawUpdates,
          hasPendingUpdates: true,  // Goes to admin review
          isOnboarded: true,
          rejectionReason: null, // ⭐ Auto-clear rejection when resubmitted
        },
      },
      { new: true, upsert: true }
    );

    // Refresh UI
    revalidatePath("/profile");

    return { success: "Profile submitted for verification." };
  } catch (error) {
    console.error("Update Profile Error:", error);
    return { error: "Failed to update profile." };
  }
}
