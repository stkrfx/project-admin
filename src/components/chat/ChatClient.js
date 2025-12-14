"use client";

import {
  useState,
  useEffect,
  useRef,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import io from "socket.io-client";
import { getMessages } from "@/actions/chat";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Send,
  Paperclip,
  Reply,
  X,
  FileText,
} from "lucide-react";

/* -------------------------------------------------------
 * Helpers
 * ------------------------------------------------------- */
const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

/* -------------------------------------------------------
 * Chat Client
 * ------------------------------------------------------- */
export default function ChatClient({ initialConversations, user }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");

  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState(initialConversations);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [isPending, startTransition] = useTransition();

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const { startUpload } = useUploadThing("chatAttachment");

  const activeConvo = conversations.find((c) => c._id === selectedId);

  /* -------------------------------------------------------
   * 1. SOCKET CONNECTION (EXTERNAL SERVER)
   * ------------------------------------------------------- */
  useEffect(() => {
    if (!user?.id) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ||
      "http://localhost:3000"; // Mindnamo server

    const s = io(socketUrl, {
      path: "/api/socket_io",
      query: {
        userId: user.id,
        role: "expert",
      },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => {
      console.log("✅ Connected to Mindnamo Socket Server");
    });

    s.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [user?.id]);

  /* -------------------------------------------------------
   * 2. LOAD MESSAGES
   * ------------------------------------------------------- */
  useEffect(() => {
    if (!selectedId || !socket) return;

    socket.emit("join_room", selectedId);

    startTransition(async () => {
      const msgs = await getMessages(selectedId);
      setMessages(msgs || []);
    });
  }, [selectedId, socket]);

  /* -------------------------------------------------------
   * 3. LISTEN FOR INCOMING MESSAGES
   * ------------------------------------------------------- */
  useEffect(() => {
    if (!socket) return;

    const handler = (msg) => {
      if (msg.conversationId === selectedId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("receive_message", handler);

    return () => {
      socket.off("receive_message", handler);
    };
  }, [socket, selectedId]);

  /* -------------------------------------------------------
   * 4. AUTO SCROLL
   * ------------------------------------------------------- */
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* -------------------------------------------------------
   * ACTIONS
   * ------------------------------------------------------- */
  const sendMessage = async (content, type = "text") => {
    if (!content.trim() && type === "text") return;
    if (!socket || !selectedId || !activeConvo) return;

    socket.emit("send_message", {
      conversationId: selectedId,
      senderId: user.id,
      receiverId: activeConvo.otherUser?._id,
      content,
      type,
      replyTo: replyTo?._id || null,
    });

    setInput("");
    setReplyTo(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await startUpload([file]);
    if (!res?.[0]?.url) return;

    const type = file.type.startsWith("image") ? "image" : "pdf";
    sendMessage(res[0].url, type);
  };

  /* -------------------------------------------------------
   * RENDER MESSAGE
   * ------------------------------------------------------- */
  const renderMessage = (msg) => {
    const isMe = msg.sender === user.id;

    return (
      <div
        key={msg._id}
        className={cn(
          "flex w-full mt-2 max-w-3xl",
          isMe ? "ml-auto justify-end" : ""
        )}
      >
        <div className="relative group max-w-[75%]">
          {msg.replyTo && (
            <div className="text-xs mb-1 px-2 py-1 bg-zinc-100 rounded border-l-2 border-zinc-400">
              Replying to:{" "}
              {msg.replyTo.contentType === "text"
                ? msg.replyTo.content.slice(0, 30)
                : msg.replyTo.contentType}
            </div>
          )}

          <div
            className={cn(
              "px-4 py-2 rounded-2xl text-sm shadow-sm",
              isMe
                ? "bg-zinc-900 text-white rounded-br-none"
                : "bg-white border border-zinc-200 rounded-bl-none"
            )}
          >
            {msg.contentType === "text" && <p>{msg.content}</p>}

            {msg.contentType === "image" && (
              <img
                src={msg.content}
                className="rounded-lg max-w-full mt-1"
              />
            )}

            {msg.contentType === "pdf" && (
              <a
                href={msg.content}
                target="_blank"
                className="flex items-center gap-2 underline"
              >
                <FileText className="w-4 h-4" />
                View Document
              </a>
            )}

            {msg.contentType === "audio" && (
              <audio controls src={msg.content} className="w-48" />
            )}
          </div>

          <div
            className={cn(
              "flex items-center gap-2 mt-1 text-[10px] text-zinc-400",
              isMe ? "justify-end" : ""
            )}
          >
            <span>{formatTime(msg.createdAt)}</span>
            <button
              onClick={() => setReplyTo(msg)}
              className="opacity-0 group-hover:opacity-100"
            >
              <Reply className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* -------------------------------------------------------
   * UI
   * ------------------------------------------------------- */
  return (
    <div className="flex h-[calc(100dvh-64px)] bg-zinc-50">
      {/* Sidebar */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b font-bold text-lg">
          Messages
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => (
            <div
              key={c._id}
              onClick={() => router.push(`/chat?id=${c._id}`)}
              className={cn(
                "p-4 cursor-pointer flex items-center gap-3 hover:bg-zinc-50",
                selectedId === c._id && "bg-zinc-100"
              )}
            >
              <Avatar>
                <AvatarImage src={c.otherUser?.image} />
                <AvatarFallback>
                  {c.otherUser?.name?.[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">
                  {c.otherUser?.name || "Client"}
                </h4>
                <p className="text-xs text-zinc-500 truncate">
                  {c.lastMessage || "Start chatting..."}
                </p>
              </div>

              {c.expertUnreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {c.expertUnreadCount}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        {selectedId ? (
          <>
            <div className="h-16 border-b bg-white flex items-center px-6">
              <Avatar className="h-8 w-8">
                <AvatarImage src={activeConvo?.otherUser?.image} />
              </Avatar>
              <span className="ml-3 font-bold">
                {activeConvo?.otherUser?.name}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {messages.map(renderMessage)}
              <div ref={scrollRef} />
            </div>

            <div className="p-4 bg-white border-t">
              {replyTo && (
                <div className="flex justify-between text-xs bg-zinc-50 p-2 mb-2 border rounded">
                  <span className="truncate">
                    Replying to: {replyTo.content}
                  </span>
                  <button onClick={() => setReplyTo(null)}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  onChange={handleFileUpload}
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-5 h-5 text-zinc-400" />
                </Button>

                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) =>
                    e.key === "Enter" && sendMessage(input)
                  }
                />

                <Button
                  onClick={() => sendMessage(input)}
                  className="bg-zinc-900 text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-400">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
