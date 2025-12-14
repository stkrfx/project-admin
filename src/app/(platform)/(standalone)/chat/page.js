/*
 * File: src/app/(platform)/(standalone)/chat/page.js
 * ROLE: Expert Chat Page (Server Component)
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { getConversations } from "@/actions/chat";
import ChatClient from "@/components/chat/ChatClient";

import connectDB from "@/lib/db";
import User from "@/models/User";

export default async function ChatPage() {
  // 1. Auth
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    // Optional: redirect to login
    return null;
  }

  // 2. Fetch conversations (already serialized in action)
  const conversations = await getConversations();

  // 3. Fetch fresh user from DB (authoritative source)
  await connectDB();
  const user = await User.findById(session.user.id)
    .select("name email image role isOnline lastSeen")
    .lean();

  if (!user) return null;

  // 4. Serialize + normalize ID
  const currentUser = JSON.parse(
    JSON.stringify({
      ...user,
      id: user._id.toString(),
    })
  );

  // 5. Render Client
  return (
    <ChatClient
      initialConversations={conversations}
      currentUser={currentUser}
    />
  );
}
