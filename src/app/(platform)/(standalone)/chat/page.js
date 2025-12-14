import { getConversations } from "@/actions/chat";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ChatClient from "@/components/chat/ChatClient";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  const conversations = await getConversations();

  return <ChatClient initialConversations={conversations} user={session?.user} />;
}