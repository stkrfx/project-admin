// src/actions/unread.js
"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Conversation from "@/models/Conversation";
import mongoose from "mongoose";

export async function getTotalUnreadCountAction() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return 0;

  try {
    await connectDB();
    // Sum expertUnreadCount (Expert side logic)
    const result = await Conversation.aggregate([
      { $match: { expertId: new mongoose.Types.ObjectId(session.user.id) } },
      { $group: { _id: null, totalUnread: { $sum: "$expertUnreadCount" } } }
    ]);

    return result.length > 0 ? result[0].totalUnread : 0;
  } catch (error) {
    console.error("[UnreadAction] Error:", error);
    return 0;
  }
}