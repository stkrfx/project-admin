// src/components/chat/UnreadChatIndicator.js
"use client";

import { useState, useEffect } from "react";
import { initSocket, getSocket } from "@/lib/socket-client";
import { getTotalUnreadCountAction } from "@/actions/unread";
import { useSession } from "next-auth/react";

export default function UnreadChatIndicator({ initialCount = 0 }) {
  const { data: session } = useSession();
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const socket = initSocket(session.user.id);

    const handleUpdate = () => {
      getTotalUnreadCountAction().then(setCount);
    };

    // Listen for events that change the total unread count
    socket.on("receiveDirectMessage", handleUpdate);
    socket.on("messagesRead", handleUpdate);

    return () => {
      const s = getSocket();
      if (s) {
        s.off("receiveDirectMessage", handleUpdate);
        s.off("messagesRead", handleUpdate);
      }
    };
  }, [session?.user?.id]);

  if (count <= 0) return null;

  return (
    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white border-2 border-white shadow-sm animate-in fade-in zoom-in-75">
      {/* ✅ FIXED: 9+ Logic applied here */}
      {count > 9 ? "9+" : count}
    </span>
  );
}