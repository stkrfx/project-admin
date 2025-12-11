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
        profile = await ExpertProfile.create({ user: session.user.id, isOnboarded: false });
        profile = await ExpertProfile.findById(profile._id).populate("user", "name email image username");
    }

    // --- JIT SWAP LOGIC (The "Next Day" Magic) ---
    // If we have a future schedule AND it's valid now (or past due), promote it.
    if (profile.futureAvailability?.validFrom && new Date() >= profile.futureAvailability.validFrom) {
        console.log("⚡ Applying Scheduled Availability Update...");
        
        // Promote Future -> Live
        profile.availability = profile.futureAvailability.schedule;
        profile.leaves = profile.futureAvailability.leaves;
        
        // Clear Future
        profile.futureAvailability = { schedule: [], leaves: [], validFrom: null };
        await profile.save();
    }

    // Prepare response
    // If there is a pending future update, we show THAT to the user so they see what they edited.
    // Otherwise show live.
    const response = JSON.parse(JSON.stringify(profile));
    
    if (profile.futureAvailability?.validFrom) {
        response.availability = profile.futureAvailability.schedule;
        response.leaves = profile.futureAvailability.leaves;
        response.isFuturePending = true; // Flag for UI
    }

    return response;

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

    const name = formData.get("name");
    const username = formData.get("username");
    const image = formData.get("image");
    if (name || username || image) await User.findByIdAndUpdate(session.user.id, { name, username, image });

    const safeParse = (key) => {
        try { return formData.get(key) ? JSON.parse(formData.get(key)) : undefined; } 
        catch { return []; }
    };

    // --- SCHEDULED UPDATES (Next Day) ---
    // Instead of overwriting 'availability', we save to 'futureAvailability'
    const futureUpdate = {
        futureAvailability: {
            schedule: safeParse("availability"),
            leaves: safeParse("leaves").map(l => ({
                date: new Date(l.date),
                isRecurring: l.isRecurring,
                note: l.note
            })),
            validFrom: getTomorrow() // <--- Activates Tomorrow
        }
    };

    // --- DRAFT UPDATES (Admin Verify) ---
    const draftUpdates = {
      bio: formData.get("bio"),
      specialization: formData.get("specialization"),
      education: formData.get("education"),
      location: formData.get("location"),
      timezone: formData.get("timezone"),
      gender: formData.get("gender"),
      experienceYears: Number(formData.get("experienceYears")) || 0,
      languages: safeParse("languages"),
      tags: safeParse("tags"),
      services: safeParse("services"), 
      documents: safeParse("documents"),
      socialLinks: {
        linkedin: formData.get("linkedin"),
        twitter: formData.get("twitter"),
        website: formData.get("website"),
      },
    };

    await ExpertProfile.findOneAndUpdate(
      { user: session.user.id },
      {
        $set: {
          ...futureUpdate,            // Saves to future bucket
          draft: draftUpdates,        
          hasPendingUpdates: true,    
          isOnboarded: true,
          rejectionReason: null 
        }
      },
      { new: true, upsert: true }
    );

    revalidatePath("/profile");
    return { success: "Profile updated successfully." };

  } catch (error) {
    console.error("Update Profile Error:", error);
    return { error: "Failed to update profile." };
  }
}