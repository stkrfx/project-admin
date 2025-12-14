"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import User from "@/models/User";

export async function getConversations() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  try {
    await connectDB();
    // Fetch conversations where expertId matches the logged-in user
    const conversations = await Conversation.find({ expertId: session.user.id })
      .populate({ path: "userId", model: User, select: "name image isOnline lastSeen" }) // Fetch Client info
      .sort({ lastMessageAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(conversations)).map(c => ({
      ...c,
      otherUser: c.userId, // Alias userId as 'otherUser' for the shared ChatClient
    }));
  } catch (error) {
    console.error("Get Conversations Error:", error);
    return [];
  }
}

export async function getMessages(conversationId) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  try {
    await connectDB();
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate({ path: "replyTo", model: Message, select: "content contentType senderModel" })
      .lean();

    return JSON.parse(JSON.stringify(messages));
  } catch (error) {
    console.error("Get Messages Error:", error);
    return [];
  }
}