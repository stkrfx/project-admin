"use server";

import connectDB from "@/lib/db";
import ExpertProfile from "@/models/ExpertProfile";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getDashboardContext() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    // Fetch Profile and populate the 'user' field to get name and image
    const profile = await ExpertProfile.findOne({ user: session.user.id })
      .populate("user", "name image") // Get name and image from User collection
      .select("isVetted hasPendingUpdates isOnboarded rejectionReason bio services specialization documents");

    // Case 0: No Profile (Should be created on login, but just in case)
    if (!profile) return { status: "NEW_USER" };

    // --- 1. DETERMINE STATUS ---
    let status = "ONBOARDING"; // Default state

    if (profile.rejectionReason) {
        // HIGHEST PRIORITY: If rejected, show the error immediately
        status = "REJECTED";
    } else if (profile.hasPendingUpdates && !profile.isVetted) {
        // Submitted but not yet live
        status = "PENDING_INITIAL"; 
    } else if (profile.isVetted) {
        // Fully active
        status = "LIVE"; 
    } else if (!profile.isOnboarded) {
        // Hasn't submitted anything yet
        status = "ONBOARDING";
    }

    // --- 2. CALCULATE PROGRESS (For Onboarding UI) ---
    // Check both Live and Draft fields
    const hasBio = !!profile.bio || !!profile.draft?.bio;
    const hasServices = (profile.services?.length > 0) || (profile.draft?.services?.length > 0);
    const hasDocs = (profile.documents?.length > 0) || (profile.draft?.documents?.length > 0);
    
    let progress = 0;
    if (hasBio) progress += 33;
    if (hasServices) progress += 33;
    if (hasDocs) progress += 34;

    // --- 3. GENERATE NOTIFICATIONS ---
    const notifications = [];

    if (status === "REJECTED") {
        notifications.push({
            id: "rejected",
            title: "Action Required",
            description: "Your profile was rejected. Please check the dashboard dashboard.",
            type: "danger", // Red icon
            link: "/profile"
        });
    }
    
    if (status === "PENDING_INITIAL") {
        notifications.push({
            id: "pending",
            title: "Verification in Progress",
            description: "You will be notified via email once approved.",
            type: "info", // Blue/Yellow icon
            link: "/profile"
        });
    }

    if (status === "LIVE" && profile.hasPendingUpdates) {
        notifications.push({
            id: "update-pending",
            title: "Update Under Review",
            description: "Your live profile is active, but recent changes are pending approval.",
            type: "warning", // Yellow icon
            link: "/profile"
        });
    }

    return {
      status,
      rejectionReason: profile.rejectionReason,
      onboarding: { 
        progress, 
        isComplete: progress >= 99 
      },
      notifications,
      // The profile._id here is the ExpertProfile collection ID
      profile: JSON.parse(JSON.stringify(profile)), 
      stats: { revenue: 0, appointments: 0, clients: 0 }
    };

  } catch (error) {
    console.error("Dashboard Context Error:", error);
    return null;
  }
}