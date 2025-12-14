/*
 * File: src/components/chat/ChatClient.js
 * ROLE: Expert / Admin Chat Client
 * CONNECTS TO: External Mindnamo Socket Server
 */

"use client";

import {
  useState,
  useEffect,
  useRef,
  useTransition,
  useMemo,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import io from "socket.io-client";

import { cn } from "@/lib/utils";
import { getMessages } from "@/actions/chat";
import { useUploadThing } from "@/lib/uploadthing";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Send,
  Paperclip,
  Reply,
  X,
  FileText,
  Clock,
  CheckCheck,
} from "lucide-react";

/* -------------------------------------------------------
 * Helpers
 * ------------------------------------------------------- */
const formatTime = (d) =>
  d
    ? new Date(d).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

/* -------------------------------------------------------
 * Chat Client
 * ------------------------------------------------------- */
export default function ChatClient({ initialConversations, currentUser }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");

  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState(initialConversations);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isPending, startTransition] = useTransition();

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { startUpload } = useUploadThing("chatAttachment");

  const activeConvo = conversations.find((c) => c._id === selectedId);

  /* -------------------------------------------------------
   * 1. SOCKET CONNECTION (External Mindnamo Server)
   * ------------------------------------------------------- */
  useEffect(() => {
    if (!currentUser?.id) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ||
      "http://localhost:3000";

    const s = io(socketUrl, {
      path: "/api/socket_io",
      query: { userId: currentUser.id, role: "expert" },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    s.on("connect", () =>
      console.log("✅ Connected to Mindnamo Socket")
    );

    setSocket(s);
    return () => s.disconnect();
  }, [currentUser?.id]);

  /* -------------------------------------------------------
   * 2. JOIN ROOM + LOAD MESSAGES
   * ------------------------------------------------------- */
  useEffect(() => {
    if (!socket || !selectedId) return;

    socket.emit("join_room", selectedId);

    startTransition(async () => {
      const history = await getMessages(selectedId);
      setMessages(history || []);
    });
  }, [socket, selectedId]);

  /* -------------------------------------------------------
   * 3. SOCKET EVENTS
   * ------------------------------------------------------- */
  useEffect(() => {
    if (!socket) return;

    const onReceiveMessage = (msg) => {
      if (msg.conversationId === selectedId) {
        setMessages((prev) => {
          // Replace optimistic message
          const idx = prev.findIndex(
            (m) =>
              m.status === "sending" &&
              m.content === msg.content
          );
          if (idx !== -1) {
            const clone = [...prev];
            clone[idx] = { ...msg, status: "sent" };
            return clone;
          }
          return [...prev, msg];
        });
      }

      // Sidebar update
      setConversations((prev) =>
        prev.map((c) =>
          c._id === msg.conversationId
            ? {
                ...c,
                lastMessage:
                  msg.contentType === "text"
                    ? msg.content
                    : `Sent ${msg.contentType}`,
                lastMessageAt: msg.createdAt,
              }
            : c
        )
      );
    };

    const onTyping = ({ conversationId }) =>
      conversationId === selectedId && setIsTyping(true);

    const onStopTyping = ({ conversationId }) =>
      conversationId === selectedId && setIsTyping(false);

    socket.on("receive_message", onReceiveMessage);
    socket.on("typing", onTyping);
    socket.on("stopTyping", onStopTyping);

    return () => {
      socket.off("receive_message", onReceiveMessage);
      socket.off("typing", onTyping);
      socket.off("stopTyping", onStopTyping);
    };
  }, [socket, selectedId]);

  /* -------------------------------------------------------
   * 4. SEND MESSAGE
   * ------------------------------------------------------- */
  const sendMessage = (content, type = "text") => {
    if (!content.trim() || !socket || !activeConvo) return;

    const optimistic = {
      _id: "tmp-" + Date.now(),
      conversationId: selectedId,
      sender: currentUser.id,
      senderModel: "Expert",
      content,
      contentType: type,
      replyTo,
      createdAt: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setReplyTo(null);

    socket.emit("send_message", {
      conversationId: selectedId,
      senderId: currentUser.id,
      receiverId: activeConvo.otherUser._id,
      content,
      type,
      replyTo: replyTo?._id || null,
    });
  };

  /* -------------------------------------------------------
   * 5. FILE UPLOAD
   * ------------------------------------------------------- */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = file.type.startsWith("image")
      ? "image"
      : "pdf";

    const res = await startUpload([file]);
    if (res?.[0]?.url) {
      sendMessage(res[0].url, type);
    }
  };

  /* -------------------------------------------------------
   * 6. AUTO SCROLL
   * ------------------------------------------------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /* -------------------------------------------------------
   * UI
   * ------------------------------------------------------- */
  return (
    <div className="flex h-[calc(100dvh-64px)] bg-zinc-50 border-t">
      <input
        type="file"
        hidden
        ref={fileInputRef}
        onChange={handleFileUpload}
      />

      {/* Sidebar */}
      <div className="w-80 bg-white border-r hidden md:flex flex-col">
        <div className="p-4 font-bold border-b">
          Messages
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => (
            <div
              key={c._id}
              onClick={() =>
                router.push(`/chat?id=${c._id}`)
              }
              className={cn(
                "p-4 cursor-pointer flex gap-3 hover:bg-zinc-50",
                selectedId === c._id && "bg-zinc-100"
              )}
            >
              <Avatar>
                <AvatarImage
                  src={c.otherUser?.profilePicture}
                />
                <AvatarFallback>
                  {c.otherUser?.name?.[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">
                  {c.otherUser?.name}
                </h4>
                <p className="text-xs text-zinc-500 truncate">
                  {c.lastMessage || "Start chatting"}
                </p>
              </div>

              {c.unreadCount > 0 && (
                <span className="bg-zinc-900 text-white text-[10px] px-2 rounded-full">
                  {c.unreadCount}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConvo ? (
          <>
            {/* Header */}
            <div className="h-16 bg-white border-b flex items-center px-6 gap-3">
              <Avatar>
                <AvatarImage
                  src={activeConvo.otherUser?.profilePicture}
                />
              </Avatar>
              <div>
                <div className="font-bold text-sm">
                  {activeConvo.otherUser?.name}
                </div>
                <div className="text-xs text-zinc-500">
                  {isTyping
                    ? "Typing..."
                    : activeConvo.otherUser?.isOnline
                    ? "Online"
                    : "Offline"}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMe =
                  msg.sender === currentUser.id;

                return (
                  <div
                    key={msg._id}
                    className={cn(
                      "flex",
                      isMe
                        ? "justify-end"
                        : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow",
                        isMe
                          ? "bg-zinc-900 text-white rounded-br-none"
                          : "bg-white border rounded-bl-none"
                      )}
                    >
                      {msg.replyTo && (
                        <div className="text-xs mb-1 opacity-70 border-l-2 pl-2">
                          {msg.replyTo.content}
                        </div>
                      )}

                      {msg.contentType === "text" && (
                        <p>{msg.content}</p>
                      )}

                      {msg.contentType === "image" && (
                        <img
                          src={msg.content}
                          className="rounded-lg"
                        />
                      )}

                      {msg.contentType === "pdf" && (
                        <a
                          href={msg.content}
                          target="_blank"
                          className="underline flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" />
                          Document
                        </a>
                      )}

                      <div className="flex items-center gap-1 text-[10px] opacity-70 mt-1 justify-end">
                        {formatTime(msg.createdAt)}
                        {isMe &&
                          (msg.status === "sending" ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <CheckCheck className="w-3 h-3" />
                          ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setReplyTo(msg)}
                      className="opacity-0 hover:opacity-100 ml-1"
                    >
                      <Reply className="w-4 h-4 text-zinc-400" />
                    </button>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t bg-white p-3">
              {replyTo && (
                <div className="flex justify-between items-center text-xs mb-2 bg-zinc-50 p-2 rounded">
                  <span className="truncate">
                    Replying to: {replyTo.content}
                  </span>
                  <button
                    onClick={() => setReplyTo(null)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >
                  <Paperclip className="w-5 h-5 text-zinc-400" />
                </Button>

                <Input
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    socket?.emit("typing", {
                      conversationId: selectedId,
                    });
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    sendMessage(input)
                  }
                  placeholder="Type a message..."
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
