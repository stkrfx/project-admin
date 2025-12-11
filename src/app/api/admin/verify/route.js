import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ExpertProfile from "@/models/ExpertProfile";
import User from "@/models/User";

// --- 1. GET: List all experts waiting for verification ---
export async function GET() {
  try {
    await connectDB();

    const pendingProfiles = await ExpertProfile.find({ hasPendingUpdates: true })
      .populate("user", "name email username image")
      .select("user draft hasPendingUpdates rejectionReason createdAt");

    return NextResponse.json({
      count: pendingProfiles.length,
      profiles: pendingProfiles
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 2. POST: Process Verification (Approve/Partial/Reject) ---
export async function POST(req) {
  try {
    await connectDB();
    
    // approvedFields: Optional array of strings (e.g. ["bio", "services"])
    // reason: Optional string (feedback for the user)
    const { expertId, action, reason, approvedFields } = await req.json();

    if (!expertId || !action) {
      return NextResponse.json({ error: "Missing expertId or action" }, { status: 400 });
    }

    const profile = await ExpertProfile.findById(expertId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // --- ACTION: APPROVE (Full or Partial) ---
    if (action === "approve") {
      const draft = profile.draft;
      
      // Whitelist of fields that can be updated via draft
      const validFields = [
        "bio", "specialization", "gender", "location", "timezone", 
        "experienceYears", "workHistory", "education", "languages", 
        "tags", "services", "documents", "socialLinks"
      ];

      // If approvedFields is provided, verify ONLY those. Otherwise, verify ALL.
      const fieldsToMerge = Array.isArray(approvedFields) && approvedFields.length > 0
        ? approvedFields.filter(f => validFields.includes(f))
        : validFields;

      // 1. Merge Draft -> Live
      fieldsToMerge.forEach(field => {
        // Check if draft actually has data for this field before overwriting
        if (draft[field] !== undefined) {
            profile[field] = draft[field];
        }
      });

      // 2. Update Status Flags
      profile.hasPendingUpdates = false; // Queue cleared
      profile.isVetted = true;           // Mark as Verified Expert
      profile.isOnboarded = true;        // Enable public access

      // 3. Set Feedback (Optional)
      // Useful for Partial Approvals: "Bio approved. Please re-upload clearer Documents."
      profile.rejectionReason = reason || null;

      await profile.save();

      return NextResponse.json({ 
        success: true, 
        message: `Profile processed. Updated fields: ${fieldsToMerge.join(", ")}`, 
        mergedFields: fieldsToMerge 
      });
    }

    // --- ACTION: REJECT (Decline Everything) ---
    if (action === "reject") {
      if (!reason) {
        return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
      }

      // Just clear the pending flag, do NOT merge any data
      profile.hasPendingUpdates = false; 
      profile.rejectionReason = reason;  

      await profile.save();

      return NextResponse.json({ success: true, message: "Updates Rejected", reason });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Admin Verify Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}