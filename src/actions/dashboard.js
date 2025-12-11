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

    // Fetch Status Fields
    const profile = await ExpertProfile.findOne({ user: session.user.id })
      .select("isVetted hasPendingUpdates isOnboarded rejectionReason bio services documents draft startingPrice");

    if (!profile) return { status: "NEW_USER" };

    // --- 1. DETERMINE STATUS ---
    let status = "ONBOARDING"; // Default

    if (profile.rejectionReason) {
        status = "REJECTED";
    } else if (profile.hasPendingUpdates && !profile.isVetted) {
        status = "PENDING_INITIAL"; // Waiting for first approval
    } else if (profile.isVetted) {
        status = "LIVE"; // Active expert
    }

    // --- 2. CALCULATE PROGRESS ---
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
            description: "Your profile changes were rejected. Please check the dashboard for details.",
            type: "danger", // Red
            link: "/profile"
        });
    }
    
    if (status === "PENDING_INITIAL") {
        notifications.push({
            id: "pending",
            title: "Verification in Progress",
            description: "You will be notified once our team approves your profile.",
            type: "info",
            link: "/profile"
        });
    }

    if (status === "LIVE" && profile.hasPendingUpdates) {
        notifications.push({
            id: "update-pending",
            title: "Update Under Review",
            description: "Your live profile is active, but recent changes are pending approval.",
            type: "warning", // Yellow
            link: "/profile"
        });
    }

    return {
      status,
      rejectionReason: profile.rejectionReason,
      onboarding: { progress, isComplete: progress >= 99 },
      notifications,
      stats: { revenue: 0, appointments: 0, clients: 0 } // Real stats go here later
    };

  } catch (error) {
    console.error("Dashboard Context Error:", error);
    return null;
  }
}