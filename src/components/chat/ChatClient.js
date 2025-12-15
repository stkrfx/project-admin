// [project-admin] src/components/chat/ChatClient.js

"use client";

import { useState, useEffect, useRef, useTransition, useCallback, useLayoutEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import ProfileImage from "@/components/ProfileImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMessages, getConversationById } from "@/actions/chat";
import io from "socket.io-client";
import { useUploadThing } from "@/lib/uploadthing";

// --- Icons ---
const SendIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>);
const MicIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>);
const PlayIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>);
const PauseIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>);
const Loader2Icon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>);
const ReplyIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>);
const XIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>);
const AttachIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>);
const SmileIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" x2="9.01" y1="9" y2="9" /><line x1="15" x2="15.01" y1="9" y2="9" /></svg>);
const SearchIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>);
const TrashIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>);
const MoreVerticalIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>);
const CheckCheckIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 7 17l-5-5" /><path d="m22 10-7.5 7.5L13 16" /></svg>);
const CheckIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>);
const ClockIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);
const ChevronDownIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>);
const FileIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>);
const DownloadIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>);
const ImageIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>);

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓'],
  'Gestures': ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪', '🦾', '🦵', '🦿'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Objects': ['💬', '👀', '💯', '💢', '💥', '💫', '💦', '💨', '🕳', '💣', '💬', '👁️‍🗨️', '🗨', '🗯', '💭', '💤', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉'],
};

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  return new Date(d1).setHours(0, 0, 0, 0) === new Date(d2).setHours(0, 0, 0, 0);
};

const formatDateHeader = (d) => {
  if (!d) return "";
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: 'UTC' });
};

const formatLastMessageTime = (d) => {
  if (!d) return "";
  const date = new Date(d);
  const today = new Date();
  if (isSameDay(date, today)) return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: 'UTC' });
};

const formatLastSeen = (d, online) => {
  if (online) return "Online";
  if (!d) return "";
  const date = new Date(d);
  const today = new Date();
  if (isSameDay(date, today)) {
    return `Last seen today at ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return `Last seen ${date.toLocaleDateString("en-US", { day: 'numeric', month: 'short' })} at ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
};

export default function ChatClient({ initialConversations, currentUser }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const isInitialLoadPhase = useRef(true);
  const initialScrollDone = useRef(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mimeTypeRef = useRef("audio/webm");
  const typingTimeoutRef = useRef(null);

  const [socket, setSocket] = useState(null);

  const sortedInitial = [...initialConversations].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  const [conversations, setConversations] = useState(sortedInitial);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const selectedConversationId = searchParams.get("id");
  const [replyingTo, setReplyingTo] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isMessagesPending, startMessagesTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState("");
  const [showScrollBottomButton, setShowScrollBottomButton] = useState(false);
  const [chatOpacity, setChatOpacity] = useState(0);
  const [currentStickyDate, setCurrentStickyDate] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef(null);
  const [viewingMedia, setViewingMedia] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [remoteStatus, setRemoteStatus] = useState({ isOnline: false, lastSeen: null });

  const { startUpload } = useUploadThing("chatAttachment");

  const selectedConversation = conversations.find(
    (c) => c._id === selectedConversationId
  );

  // ✅ ADAPTATION: Identify the "Other User" correctly for the Expert
  const remoteUser = selectedConversation?.otherUser;

  useEffect(() => {
    if (remoteUser) {
      setRemoteStatus(prev => {
        if (prev.isOnline === remoteUser.isOnline && prev.lastSeen === remoteUser.lastSeen) return prev;
        return { isOnline: remoteUser.isOnline, lastSeen: remoteUser.lastSeen };
      });
    }
  }, [selectedConversationId, remoteUser]);

  // --- SOCKET CONNECTION ---
  useEffect(() => {
    let newSocket;

    const initSocket = async () => {
      const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3002";

      newSocket = io(socketUrl, {
        path: "/api/socket_io",
        query: {
          userId: currentUser.id,
          role: "expert", // ✅ REQUIRED
        },
        transports: ["websocket", "polling"],
        withCredentials: true,
      });

      newSocket.on("connect", () => {
        console.log("✅ Expert Socket Connected");
      });

      setSocket(newSocket);
    };

    initSocket();
    return () => newSocket?.disconnect();
  }, [currentUser.id]);


  useEffect(() => { setIsMounted(true); }, []);
  useLayoutEffect(() => { if (replyingTo) inputRef.current?.focus(); }, [replyingTo]);
  useLayoutEffect(() => { if (selectedConversationId && !isMessagesPending) inputRef.current?.focus(); }, [selectedConversationId, isMessagesPending]);

  const updateChatList = useCallback((updatedConvo) => {
    setConversations(prev => {
      const newConversations = prev.map(c => c._id === updatedConvo.conversationId ? { ...c, ...updatedConvo } : c);
      return newConversations.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    });
  }, []);

  const handleScrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: "auto" });
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !selectedConversationId) return;
    socket.emit("typing", { conversationId: selectedConversationId, typerId: currentUser.id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { conversationId: selectedConversationId, typerId: currentUser.id });
    }, 2000);
  };

  const onUserStatusChanged = useCallback(({ userId, isOnline, lastSeen }) => {
    // ✅ ADAPTATION: Check against remoteUser._id
    if (remoteUser?._id === userId) {
      setRemoteStatus(prev => ({ ...prev, isOnline, lastSeen: lastSeen || prev.lastSeen }));
    }
  }, [remoteUser]);

  // ✅ Sidebar preview ONLY (no unread logic here)
  const onReceiveDirectMessage = useCallback(
    async (message) => {
      let previewText = message.content;
      if (message.contentType === "audio") previewText = "🎤 Audio Message";
      else if (message.contentType === "image") previewText = "📷 Image";
      else if (message.contentType === "pdf") previewText = "📄 Document";

      let shouldFetch = false;

      setConversations(prev => {
        const exists = prev.some(c => c._id === message.conversationId);

        if (exists) {
          return prev
            .map(c =>
              c._id === message.conversationId
                ? {
                  ...c,
                  lastMessage: previewText,
                  lastMessageAt: message.createdAt,
                  lastMessageSender: message.sender,
                }
                : c
            )
            .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        }

        shouldFetch = true;
        return prev;
      });

      // ✅ NEW conversation → fetch safely
      if (shouldFetch) {
        try {
          const convo = await getConversationById(message.conversationId);
          if (convo) {
            setConversations(prev => [convo, ...prev]);
          }
        } catch (err) {
          console.error("Failed to fetch conversation:", err);
        }
      }
    },
    []
  );



  const onTyping = useCallback(({ conversationId, typerId }) => {
    if (conversationId === selectedConversationId && typerId !== currentUser.id) setIsTyping(true);
    setConversations(prev => prev.map(c => c._id === conversationId ? { ...c, isTyping: true } : c));
  }, [selectedConversationId, currentUser.id]);

  const onStopTyping = useCallback(({ conversationId, typerId }) => {
    if (conversationId === selectedConversationId && typerId !== currentUser.id) setIsTyping(false);
    setConversations(prev => prev.map(c => c._id === conversationId ? { ...c, isTyping: false } : c));
  }, [selectedConversationId, currentUser.id]);

  const addOptimisticMessage = (content, contentType = "text") => {
    const tempId = "temp-" + Date.now();

    const optimisticMsg = {
      _id: tempId,
      conversationId: selectedConversationId,
      sender: currentUser.id,
      senderModel: "Expert", // ✅ FIXED
      content,
      contentType,
      replyTo: replyingTo,
      createdAt: new Date().toISOString(),
      readBy: [currentUser.id],
      status: "sending",
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setReplyingTo(null);
    return optimisticMsg;
  };


  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let contentType = "text";
    if (file.type.startsWith("image/")) contentType = "image";
    else if (file.type === "application/pdf") contentType = "pdf";
    else { alert("Only images and PDFs are supported."); return; }

    const blobUrl = URL.createObjectURL(file);
    const optimisticMsg = addOptimisticMessage(blobUrl, contentType);

    try {
      const res = await startUpload([file]);
      if (res && res[0]) {
        const realUrl = res[0].url;
        setMessages(prev => prev.map(msg =>
          msg._id === optimisticMsg._id ? { ...msg, content: realUrl } : msg
        ));
        sendMessageSocket(realUrl, contentType);
      }
    } catch (error) {
      console.error("File upload failed:", error);
      setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // [!code fix] UPDATED RECORDING LOGIC (ADMIN / EXPERT)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      }

      mimeTypeRef.current = mimeType;

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      // ✅ Process ONLY after recorder fully stops
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size === 0) return;

        const ext = mimeType.includes("mp4") ? "m4a" : "webm";
        const audioFile = new File(
          [audioBlob],
          `voice-message.${ext}`,
          { type: mimeType }
        );

        const blobUrl = URL.createObjectURL(audioBlob);

        // 1️⃣ Optimistic message (Expert)
        const optimisticMsg = addOptimisticMessage(blobUrl, "audio");

        try {
          const res = await startUpload([audioFile]);
          if (res && res[0]) {
            const realUrl = res[0].url;

            // 2️⃣ Sync optimistic content BEFORE socket echo
            setMessages(prev =>
              prev.map(msg =>
                msg._id === optimisticMsg._id
                  ? { ...msg, content: realUrl }
                  : msg
              )
            );

            sendMessageSocket(realUrl, "audio");
          }
        } catch (error) {
          console.error("Upload error:", error);
          setMessages(prev =>
            prev.filter(m => m._id !== optimisticMsg._id)
          );
        }

        // Cleanup
        stream.getTracks().forEach(track => track.stop());
      };

      // Request frequent buffer flush
      mediaRecorder.start(100);

      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);

    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop(); // triggers onstop
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // 🚫 Prevent upload logic
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();

      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach(track => track.stop());
      }

      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
      setRecordingTime(0);
      audioChunksRef.current = [];
    }
  };


  const sendMessageSocket = (content, contentType = "text") => {
    if (!selectedConversationId || !socket || !remoteUser?._id) return;

    socket.emit("send_message", {
      conversationId: selectedConversationId,
      senderId: currentUser.id,
      receiverId: remoteUser._id,
      content,
      contentType, // ✅ FIXED: standardized key
      senderModel: "Expert",
      replyTo: replyingTo ? replyingTo._id : null,
    });
  };



  const handleSendMessage = (e) => { e.preventDefault(); if (!newMessage.trim()) return; addOptimisticMessage(newMessage, "text"); sendMessageSocket(newMessage, "text"); setNewMessage(""); inputRef.current?.focus(); };
  const handleDeleteMessage = (messageId) => {
    if (!socket) return;

    // ✅ Optimistic delete (do NOT remove message)
    setMessages(prev =>
      prev.map(m =>
        m._id === messageId
          ? {
            ...m,
            isDeleted: true,
            content: "🚫 This message was deleted",
            contentType: "text",
          }
          : m
      )
    );

    socket.emit("deleteMessage", {
      conversationId: selectedConversationId,
      messageId,
    });

    setDeleteConfirmId(null);
  };


  const onReceiveMessage = useCallback(
    (message) => {
      if (message.conversationId === selectedConversationId) {
        setMessages((prev) => {
          // ✅ Replace optimistic message
          if (message.sender === currentUser.id) {
            const pendingIndex = prev.findIndex(
              (m) =>
                m.status === "sending" &&
                m.content === message.content &&
                m.conversationId === message.conversationId
            );

            if (pendingIndex !== -1) {
              const updated = [...prev];
              updated[pendingIndex] = {
                ...updated[pendingIndex],
                ...message,
                status: "sent",
              };
              return updated;
            }
          }

          return [...prev, message];
        });

        // ✅ FIX: instantly mark as read if chat is open
        if (message.sender !== currentUser.id && socket) {
          socket.emit("markAsRead", {
            conversationId: selectedConversationId,
            userId: currentUser.id,
          });
        }
      }

      // ✅ Conversation preview update
      let previewText = message.content;
      if (message.contentType === "audio") previewText = "🎤 Audio Message";
      else if (message.contentType === "image") previewText = "📷 Image";
      else if (message.contentType === "pdf") previewText = "📄 Document";

      const updates = {
        conversationId: message.conversationId,
        lastMessage: previewText,
        lastMessageAt: message.createdAt,
        lastMessageSender: message.sender,
        lastMessageStatus: "sent",
      };

      // 👇 IF *I SENT* (Expert → Client)
      if (message.sender === currentUser.id) {
        updates.userUnreadCount = 1;   // Client hasn't read yet
        updates.expertUnreadCount = 0; // I always read my own message
      }

      // 👇 IF *CLIENT SENT* → BADGE
      if (message.sender !== currentUser.id) {
        updates.expertUnreadCount =
          selectedConversationId === message.conversationId ? 0 : 1;
      }

      // ✅ FIX: Force clear typing status in sidebar
      updates.isTyping = false;

      updateChatList(updates);

      // ✅ FIX: Force clear typing status in active chat window
      if (
        message.conversationId === selectedConversationId &&
        message.sender !== currentUser.id
      ) {
        setIsTyping(false);
      }


    },
    [selectedConversationId, currentUser.id, socket, updateChatList]
  );


  const onMessagesRead = useCallback(
    ({ conversationId, readByUserId }) => {

      // 🫧 Message bubbles (unchanged)
      if (conversationId === selectedConversationId) {
        setMessages(prev =>
          prev.map(msg =>
            msg.sender === currentUser.id &&
              !msg.readBy.includes(readByUserId)
              ? { ...msg, readBy: [...msg.readBy, readByUserId] }
              : msg
          )
        );
      }

      // ✅ SIDEBAR → CLIENT read → clear userUnreadCount
      if (readByUserId !== currentUser.id) {
        setConversations(prev =>
          prev.map(c =>
            c._id === conversationId
              ? { ...c, userUnreadCount: 0 }
              : c
          )
        );
      }
    },
    [selectedConversationId, currentUser.id]
  );


  const onMessageDeleted = useCallback(({ messageId }) => {
    setMessages(prev =>
      prev.map(msg =>
        msg._id === messageId
          ? {
            ...msg,
            isDeleted: true,
            content: "🚫 This message was deleted",
            contentType: "text",
          }
          : msg
      )
    );
  }, []);


  const onConversationUpdated = useCallback((updatedConvo) => { updateChatList(updatedConvo); }, [updateChatList]);

  useEffect(() => {
    if (!selectedConversationId || !socket) return;
    initialScrollDone.current = false;
    isInitialLoadPhase.current = true;
    setChatOpacity(0);
    setTimeout(() => { isInitialLoadPhase.current = false; }, 2000);

    socket.emit("join_room", selectedConversationId);

    // ✅ ADAPTATION: Clear expertUnreadCount instead of userUnreadCount
    setConversations(prev => prev.map(c => c._id === selectedConversationId ? { ...c, expertUnreadCount: 0 } : c));
    setIsTyping(false);

    startMessagesTransition(async () => {
      setMessages([]);
      const history = await getMessages(selectedConversationId);
      setMessages(history);
      // ✅ Emit Read Receipt as Expert
      socket.emit("markAsRead", { conversationId: selectedConversationId, userId: currentUser.id });
    });
  }, [selectedConversationId, currentUser.id, socket]);

  useEffect(() => {
    if (!socket) return;
    socket.on("receive_message", onReceiveMessage);
    socket.on("messageDeleted", onMessageDeleted);
    socket.on("typing", onTyping);
    socket.on("stopTyping", onStopTyping);
    socket.on("userStatusChanged", onUserStatusChanged);
    socket.on("messagesRead", onMessagesRead);
    return () => {
      socket.off("receive_message", onReceiveMessage);
      socket.off("messageDeleted", onMessageDeleted);
      socket.off("typing", onTyping);
      socket.off("stopTyping", onStopTyping);
      socket.off("userStatusChanged", onUserStatusChanged);
      socket.off("messagesRead", onMessagesRead);
    };
  }, [selectedConversationId, socket, onReceiveMessage, onTyping, onStopTyping, onUserStatusChanged, onMessagesRead]);

  useEffect(() => {
    if (!socket) return;

    socket.on("receiveDirectMessage", onReceiveDirectMessage);

    return () => {
      socket.off("receiveDirectMessage", onReceiveDirectMessage);
    };
  }, [socket, onReceiveDirectMessage]);


  useLayoutEffect(() => { if (messages.length > 0 && messagesContainerRef.current && !isMessagesPending) { const container = messagesContainerRef.current; if (!initialScrollDone.current) { container.scrollTop = container.scrollHeight; initialScrollDone.current = true; setChatOpacity(1); } else { const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150; if (isNearBottom) { container.scrollTo({ top: container.scrollHeight, behavior: "auto" }); } } } else if (messages.length === 0 && !isMessagesPending) { setChatOpacity(1); } }, [messages, isMessagesPending]);
  useEffect(() => { const container = messagesContainerRef.current; if (!container) return; const handleScroll = () => { const { scrollTop, scrollHeight, clientHeight } = container; const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; setShowScrollBottomButton(!isNearBottom); const dateHeaders = container.querySelectorAll('[data-date-header]'); let currentDate = ""; dateHeaders.forEach((header) => { const rect = header.getBoundingClientRect(); const containerRect = container.getBoundingClientRect(); if (rect.top <= containerRect.top + 60) currentDate = header.getAttribute('data-date-header'); }); setCurrentStickyDate(currentDate); }; container.addEventListener('scroll', handleScroll); return () => container.removeEventListener('scroll', handleScroll); }, [isMessagesPending]);
  const handleImageLoad = useCallback(() => { const container = messagesContainerRef.current; if (!container) return; if (isInitialLoadPhase.current) { container.scrollTo({ top: container.scrollHeight, behavior: "auto" }); } else { const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300; if (isNearBottom) { container.scrollTo({ top: container.scrollHeight, behavior: "auto" }); } } }, []);
  useEffect(() => { const handleClickOutside = (event) => { if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target) && emojiButtonRef.current && !emojiButtonRef.current.contains(event.target)) { setShowEmojiPicker(false); } }; if (showEmojiPicker) { document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); } }, [showEmojiPicker]);
  const handleEmojiSelect = (emoji) => { const input = inputRef.current; if (input) { const start = input.selectionStart; const end = input.selectionEnd; const text = newMessage; const newText = text.substring(0, start) + emoji + text.substring(end); setNewMessage(newText); requestAnimationFrame(() => { input.selectionStart = input.selectionEnd = start + emoji.length; input.focus(); }); } else { setNewMessage(prev => prev + emoji); } };
  const scrollToMessage = (messageId) => { const messageEl = document.getElementById(`message-${messageId}`); if (messageEl) { messagesContainerRef.current?.scrollTo({ top: messageEl.offsetTop - (messagesContainerRef.current.offsetTop || 0) - 20, behavior: "auto" }); messageEl.classList.add("animate-flash"); setTimeout(() => messageEl.classList.remove("animate-flash"), 1000); } };
  const formatTime = (seconds) => { if (isNaN(seconds)) return "0:00"; const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${mins}:${secs.toString().padStart(2, '0')}`; };
  const handleViewMedia = (src, type) => { if (type === 'pdf') window.open(src, '_blank'); else setViewingMedia({ src, type }); };
  const filteredEmojis = emojiSearch ? Object.values(EMOJI_CATEGORIES).flat().filter(() => true) : EMOJI_CATEGORIES;
  const groupedMessages = useMemo(() => { const groups = {}; messages.forEach(msg => { const date = formatDateHeader(msg.createdAt); if (!groups[date]) groups[date] = []; groups[date].push(msg); }); return groups; }, [messages]);

  return (
    <div className="flex h-[calc(100dvh-4rem)] bg-white relative">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileSelect} />
      {viewingMedia && <MediaViewerModal src={viewingMedia.src} type={viewingMedia.type} onClose={() => setViewingMedia(null)} />}
      <div className="w-full max-w-sm flex-col border-r border-zinc-200 bg-white hidden md:flex">
        <div className="p-4 border-b border-zinc-200"><h2 className="text-2xl font-bold text-zinc-900 px-2">Messages</h2><p className="text-sm text-zinc-500 mt-1 px-2">Your conversations</p></div>
        <div className="flex-1 overflow-y-auto py-2">{conversations.length > 0 ? (conversations.map((convo) => (<ConversationItem key={convo._id} convo={convo} isSelected={convo._id === selectedConversationId} onClick={() => router.push(`/chat?id=${convo._id}`, { scroll: false })} isMounted={isMounted} currentUserId={currentUser.id} isTyping={convo.isTyping} />))) : (<div className="p-8 text-center"><p className="text-zinc-500">No conversations yet.</p></div>)}</div>
      </div>
      <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
        {selectedConversation ? (
          <>
            <div className="flex-shrink-0 flex items-center gap-4 px-6 py-4 border-b border-zinc-200 bg-white shadow-sm z-20"><ProfileImage src={remoteUser?.profilePicture} name={remoteUser?.name} sizeClass="h-12 w-12" /><div className="flex-1"><h3 className="font-semibold text-lg text-zinc-900">{remoteUser?.name}</h3><p className="text-sm text-zinc-500">{isTyping ? <span className="text-indigo-600 font-medium animate-pulse">typing...</span> : formatLastSeen(remoteStatus.lastSeen, remoteStatus.isOnline)}</p></div></div>
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-4 bg-zinc-50 relative" style={{ opacity: isMessagesPending ? 1 : chatOpacity }}>
              {isMessagesPending ? (<div className="flex h-full items-center justify-center"><Loader2Icon className="h-10 w-10 animate-spin text-indigo-600 mx-auto mb-4" /><p className="text-zinc-500">Loading messages...</p></div>) : (
                <div className="pb-2">{Object.entries(groupedMessages).map(([date, msgs]) => (<div key={date} className="relative mb-6"><div className="sticky top-2 z-10 flex justify-center my-4 pointer-events-none"><span className="bg-white/90 backdrop-blur-sm text-zinc-600 px-4 py-1.5 rounded-full text-xs font-medium shadow-md border border-zinc-100">{date}</span></div><div className="space-y-1">{msgs.map((msg) => { const prevMsg = msgs[msgs.indexOf(msg) - 1]; const nextMsg = msgs[msgs.indexOf(msg) + 1]; const isSender = msg.sender === currentUser.id; const isFirstInGroup = !prevMsg || prevMsg.sender !== msg.sender; const isLastInGroup = !nextMsg || nextMsg.sender !== msg.sender; return (<MessageBubble key={msg._id} message={msg} isSender={isSender} isFirstInGroup={isFirstInGroup} isLastInGroup={isLastInGroup} onReplyClick={() => setReplyingTo(msg)} onReplyView={scrollToMessage} onDeleteClick={() => setDeleteConfirmId(msg._id)} showDeleteConfirm={deleteConfirmId === msg._id} onConfirmDelete={() => handleDeleteMessage(msg._id)} onCancelDelete={() => setDeleteConfirmId(null)} isMounted={isMounted} currentUserId={currentUser.id} onViewMedia={handleViewMedia} onImageLoad={handleImageLoad} />); })}</div></div>))}</div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {showScrollBottomButton && <Button size="icon" variant="secondary" className="absolute bottom-24 right-8 h-10 w-10 rounded-full shadow-lg z-30 bg-white border border-zinc-200 hover:bg-zinc-100 animate-in fade-in zoom-in duration-200" onClick={handleScrollToBottom}><ChevronDownIcon className="h-5 w-5 text-zinc-500" /></Button>}
            <div className="flex-shrink-0 p-4 border-t border-zinc-200 bg-white z-20">
              {replyingTo && <ReplyPreview message={replyingTo} onCancel={() => setReplyingTo(null)} />}
              {isRecording ? (
                <div className="flex items-center gap-3 animate-in fade-in duration-200"><div className="flex-1 bg-white border border-red-200 rounded-md px-4 py-2 flex items-center justify-between text-red-600"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" /><span className="font-mono font-medium">{formatTime(recordingTime)}</span></div><span className="text-xs text-zinc-500">Recording...</span></div><Button type="button" size="icon" variant="ghost" onClick={cancelRecording} className="text-zinc-400 hover:text-red-600 shrink-0"><TrashIcon className="h-5 w-5" /></Button><Button type="button" size="icon" className="bg-indigo-600 text-white shrink-0 rounded-full h-10 w-10" onClick={stopRecording}><SendIcon className="h-5 w-5" /></Button></div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2 items-end relative">
                  <div className="flex gap-1">
                    <div className="relative"><Button ref={emojiButtonRef} type="button" size="icon" variant="ghost" onMouseDown={(e) => e.preventDefault()} className={cn("text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 shrink-0", showEmojiPicker && "bg-zinc-100 text-indigo-600")} onClick={() => setShowEmojiPicker(!showEmojiPicker)}><SmileIcon /></Button>{showEmojiPicker && (<div ref={emojiPickerRef} className="absolute bottom-full left-0 mb-2 w-80 bg-white border border-zinc-200 rounded-lg shadow-lg z-50"><div className="p-3 border-b border-zinc-200 flex items-center"><div className="relative flex-1"><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" /><Input type="text" placeholder="Search emoji..." value={emojiSearch} onChange={(e) => setEmojiSearch(e.target.value)} className="w-full pl-10 pr-3 py-2 bg-white border-zinc-200 rounded-md text-sm h-9" onMouseDown={(e) => e.stopPropagation()} /></div></div><div className="max-h-80 overflow-y-auto p-2">{Object.entries(filteredEmojis).map(([category, emojis]) => (<div key={category} className="mb-2"><h4 className="text-xs font-semibold text-zinc-500 mb-2 px-2 uppercase">{category}</h4><div className="grid grid-cols-8 gap-0.5">{emojis.map((emoji, idx) => (<button key={idx} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handleEmojiSelect(emoji)} className="flex items-center justify-center w-full h-10 text-2xl hover:bg-zinc-100 rounded transition-colors">{emoji}</button>))}</div></div>))}</div></div>)}</div>
                    <Button type="button" size="icon" variant="ghost" className="text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 shrink-0" onMouseDown={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()}><AttachIcon /></Button>
                  </div>
                  <Input ref={inputRef} value={newMessage} onChange={handleTyping} placeholder="Type a message..." className="flex-1 bg-zinc-50 border-zinc-200 resize-none focus:bg-white" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }} />
                  {newMessage.trim() ? <Button type="submit" size="icon" className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0" onMouseDown={(e) => e.preventDefault()}><SendIcon className="h-5 w-5" /></Button> : <Button type="button" size="icon" className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0" onClick={startRecording}><MicIcon className="h-5 w-5" /></Button>}
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full items-center justify-center text-zinc-400 p-8 text-center"><div className="max-w-md"><h3 className="text-2xl font-semibold text-zinc-900 mb-2">Welcome to Messages</h3><p className="text-zinc-500">Select a conversation from the left to start chatting with a client.</p></div></div>
        )}
      </div>
    </div>
  );
}

// --- UTILITY COMPONENTS (Inlined) ---

function SmartImage({ src, alt, onClick, onLoad }) { const [displaySrc, setDisplaySrc] = useState(src); useEffect(() => { if (src !== displaySrc) { const img = new Image(); img.src = src; img.onload = () => { setDisplaySrc(src); }; } }, [src, displaySrc]); return (<img src={displaySrc} alt={alt} className="max-w-full h-auto object-cover max-h-64" onClick={onClick} onLoad={onLoad} />); }
function MediaViewerModal({ src, type, onClose }) { if (!src) return null; return (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}> <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"><XIcon className="h-6 w-6" /></button> <div className="relative w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>{type === 'image' && <img src={src} alt="Full view" className="max-w-full max-h-full object-contain rounded-md shadow-2xl" />}</div> </div>); }
function ConversationItem({ convo, isSelected, onClick, isMounted, currentUserId, isTyping }) {
  const otherUser = convo.otherUser; const isLastMessageMine = convo.lastMessageSender === currentUserId; const isReadByClient = convo.userUnreadCount === 0; const isSending = convo.lastMessageStatus === 'sending'; return (<button onClick={onClick} className={cn("flex w-full items-start gap-4 px-4 py-4 text-left hover:bg-zinc-50 transition-all duration-200", isSelected && "bg-zinc-50 border-l-4 border-indigo-600 pl-3")}> <ProfileImage src={otherUser?.profilePicture} name={otherUser?.name} sizeClass="h-12 w-12 shrink-0" /> <div className="flex-1 overflow-hidden min-w-0"> <div className="flex justify-between items-start mb-1 gap-2"><h3 className="font-semibold text-base text-zinc-900 truncate">{otherUser?.name}</h3><span className="text-xs text-zinc-500 shrink-0 pt-1">{isMounted ? formatLastMessageTime(convo.lastMessageAt) : null}</span></div> <div className="flex justify-between items-center gap-2"><div className="flex items-center gap-1 overflow-hidden flex-1">{isTyping ? <p className="text-sm text-indigo-600 font-medium truncate animate-pulse">typing...</p> : <>{isLastMessageMine && (
    isSending ? (
      <ClockIcon className="h-3 w-3 text-zinc-400 shrink-0" />
    ) : (
      <CheckCheckIcon
        className={cn(
          "h-4 w-4 shrink-0",
          isReadByClient ? "text-blue-500" : "text-zinc-400"
        )}
      />
    )
  )}
    <p className="text-sm text-zinc-500 truncate">{convo.lastMessage || "No messages yet"}</p></>}</div>{convo.expertUnreadCount > 0 && <span className="flex items-center justify-center bg-indigo-600 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 shrink-0">{convo.expertUnreadCount}</span>}</div> </div> </button>);
}
function VoiceMessagePlayer({ src, isSender }) { const [isPlaying, setIsPlaying] = useState(false); const [progress, setProgress] = useState(0); const [duration, setDuration] = useState(0); const audioRef = useRef(null); useEffect(() => { const audio = audioRef.current; if (!audio) return; const updateProgress = () => { const current = audio.currentTime; const total = audio.duration; if (Number.isFinite(total) && total > 0) { setProgress((current / total) * 100); setDuration(total); } else { setProgress(0); setDuration(0); } }; const setAudioData = () => { const d = audio.duration; if (Number.isFinite(d)) setDuration(d); }; const handleEnded = () => { setIsPlaying(false); setProgress(0); }; audio.addEventListener('timeupdate', updateProgress); audio.addEventListener('loadedmetadata', setAudioData); audio.addEventListener('durationchange', setAudioData); audio.addEventListener('ended', handleEnded); return () => { audio.removeEventListener('timeupdate', updateProgress); audio.removeEventListener('loadedmetadata', setAudioData); audio.removeEventListener('durationchange', setAudioData); audio.removeEventListener('ended', handleEnded); }; }, []); const togglePlay = () => { const audio = audioRef.current; if (!audio) return; if (isPlaying) audio.pause(); else audio.play(); setIsPlaying(!isPlaying); }; const handleSeek = (e) => { const audio = audioRef.current; if (!audio) return; const newTime = (e.target.value / 100) * audio.duration; audio.currentTime = newTime; setProgress(e.target.value); }; const formatTime = (time) => { if (!Number.isFinite(time) || isNaN(time)) return "0:00"; const mins = Math.floor(time / 60); const secs = Math.floor(time % 60); return `${mins}:${secs.toString().padStart(2, '0')}`; }; return (<div className="flex items-center gap-3 pr-4 min-w-[200px] py-1"> <audio ref={audioRef} src={src} className="hidden" /> <button onClick={togglePlay} className={cn("flex items-center justify-center h-10 w-10 rounded-full transition-colors shrink-0", isSender ? "bg-white/20 hover:bg-white/30 text-white" : "bg-indigo-50 hover:bg-indigo-100 text-indigo-600")}>{isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5 ml-0.5" />}</button> <div className="flex-1 flex flex-col gap-1"><input type="range" min="0" max="100" value={progress || 0} onChange={handleSeek} className={cn("w-full h-1 rounded-lg appearance-none cursor-pointer", isSender ? "bg-white/30 accent-white" : "bg-zinc-200 accent-indigo-600")} /><div className={cn("flex justify-between text-[10px] font-medium", isSender ? "text-white/80" : "text-zinc-500")}><span>{formatTime(audioRef.current?.currentTime || 0)}</span><span>{formatTime(duration)}</span></div></div> </div>); }
function MessageBubble({ message, isSender, isFirstInGroup, isLastInGroup, onReplyClick, onReplyView, onDeleteClick, showDeleteConfirm, onConfirmDelete, onCancelDelete, isMounted, currentUserId, onViewMedia, onImageLoad }) { const [showMenu, setShowMenu] = useState(false); const menuRef = useRef(null); const timestamp = isMounted ? new Date(message.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : null; const canDelete = message.sender === currentUserId; const isDeleted = message.isDeleted === true; const isSending = message.status === "sending"; const isRead = message.readBy && message.readBy.some(id => id !== currentUserId); const isAudio = message.contentType === 'audio' || (typeof message.content === 'string' && message.content.startsWith('data:audio')); const isImage = message.contentType === 'image'; const isPdf = message.contentType === 'pdf'; useEffect(() => { const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false); }; if (showMenu) { document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); } }, [showMenu]); return (<div id={`message-${message._id}`} className={cn("flex w-full group", isFirstInGroup ? "mt-3" : "mt-1")}> <div className={cn("flex w-full", isSender ? "justify-end" : "justify-start")}> <div className={cn("px-4 py-2.5 pb-6 relative shadow-sm max-w-[75%]", isSender ? "bg-indigo-600 text-white" : "bg-white text-zinc-800 border border-zinc-200", "rounded-2xl", !isFirstInGroup && isSender && "rounded-tr-md", !isFirstInGroup && !isSender && "rounded-tl-md", !isLastInGroup && isSender && "rounded-br-md", !isLastInGroup && !isSender && "rounded-bl-md")}> {message.replyTo && (<button onClick={() => onReplyView(message.replyTo._id)} className={cn("block p-2.5 rounded-lg mb-2 w-full text-left", "border-l-4", isSender ? "bg-black/10 border-white/50" : "bg-zinc-50 border-indigo-500")}> <p className={cn("font-semibold text-xs mb-1", isSender ? "text-white" : "text-indigo-600")}>{message.replyTo.senderModel}</p> {message.replyTo.contentType === 'image' ? <div className="flex items-center gap-2 mt-1"><ImageIcon className="h-4 w-4" /> <span className="text-xs opacity-80">Photo</span></div> : message.replyTo.contentType === 'pdf' ? <div className="flex items-center gap-2 mt-1"><FileIcon className="h-4 w-4" /> <span className="text-xs opacity-80">Document</span></div> : <p className={cn("text-sm truncate", isSender ? "text-white/80" : "text-zinc-600")}>{message.replyTo.content}</p>} </button>)} {isAudio ? <VoiceMessagePlayer src={message.content} isSender={isSender} /> : isImage ? <div className="mb-1 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onClick={() => onViewMedia(message.content, 'image')}><SmartImage src={message.content} alt="Shared image" onLoad={onImageLoad} /></div> : isPdf ? <a href={message.content} target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer", isSender ? "bg-white/10 hover:bg-white/20" : "bg-zinc-100 hover:bg-zinc-200")}><div className={cn("p-2 rounded-full", isSender ? "bg-white/20" : "bg-white")}><FileIcon className="h-5 w-5" /></div><div className="flex-1 overflow-hidden"><p className="text-sm font-medium truncate">Document.pdf</p><p className={cn("text-xs", isSender ? "text-white/80" : "text-zinc-500")}>Tap to view</p></div><DownloadIcon className="h-4 w-4 opacity-70" /></a> : <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap pr-16">{message.content}</p>} <div className="absolute right-3 bottom-1.5 flex items-center gap-1"><span className={cn("text-[11px]", isSender ? "text-white/70" : "text-zinc-400")}>{timestamp}</span>{isSender && (isSending ? <ClockIcon className="h-3 w-3 text-white/70" /> : <CheckCheckIcon className={cn("h-3.5 w-3.5", isRead ? "text-blue-300" : "text-white/70")} />)}</div> <div className={cn("absolute top-0 flex gap-1 transition-all opacity-0 group-hover:opacity-100", isSender ? "-left-16" : "-right-16")}>{!isDeleted && (<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white border border-zinc-200 shadow-md hover:bg-zinc-50" onClick={onReplyClick} onMouseDown={(e) => e.preventDefault()}><ReplyIcon className="h-4 w-4 text-zinc-600" /></Button>)}{canDelete && !isDeleted && (<div className="relative" ref={menuRef}><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white border border-zinc-200 shadow-md hover:bg-zinc-50" onClick={() => setShowMenu(!showMenu)} onMouseDown={(e) => e.preventDefault()}><MoreVerticalIcon className="h-4 w-4 text-zinc-600" /></Button>{showMenu && (<div className="absolute top-full mt-1 right-0 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 min-w-[150px]"><button onClick={() => { onDeleteClick(); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2 text-red-600"><TrashIcon />Delete Message</button></div>)}</div>)}</div> {showDeleteConfirm && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl"><h3 className="text-lg font-semibold mb-2 text-zinc-900">Delete Message?</h3><p className="text-sm text-zinc-500 mb-4">This message will be deleted for everyone. This action cannot be undone.</p><div className="flex gap-2 justify-end"><Button variant="ghost" onClick={onCancelDelete}>Cancel</Button><Button variant="destructive" onClick={onConfirmDelete}>Delete</Button></div></div></div>)} </div> </div> </div>); }
function ReplyPreview({ message, onCancel }) { const isImage = message.contentType === 'image'; const isPdf = message.contentType === 'pdf'; const isAudio = message.contentType === 'audio'; return (<div className="flex items-center justify-between p-3 mb-3 rounded-lg bg-zinc-50 border-l-4 border-indigo-600"> <div className="flex-1 overflow-hidden"> <p className="font-semibold text-sm text-indigo-600 mb-1">Replying to {message.senderModel === "Expert" ? "yourself" : message.senderModel}</p> {isImage ? <div className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-zinc-500" /><span className="text-sm text-zinc-500">Photo</span></div> : isPdf ? <div className="flex items-center gap-2"><FileIcon className="h-4 w-4 text-zinc-500" /><span className="text-sm text-zinc-500">Document</span></div> : isAudio ? <div className="flex items-center gap-2"><MicIcon className="h-4 w-4 text-zinc-500" /><span className="text-sm text-zinc-500">Voice Message</span></div> : <p className="text-sm text-zinc-500 truncate">{message.content}</p>} </div> <Button variant="ghost" size="icon" onClick={onCancel} className="ml-2 hover:bg-zinc-200 shrink-0"><XIcon className="h-5 w-5 text-zinc-500" /></Button> </div>); }