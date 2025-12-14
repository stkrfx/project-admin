/*
 * File: src/actions/chat.js
 * ACTION: Expert-side Chat Logic
 * Architecture: User ↔ User (Expert is a User with ExpertProfile)
 */

"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";

import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import User from "@/models/User";

/* -----------------------------------------------------
 * 1. GET CONVERSATIONS (Expert Inbox)
 * ----------------------------------------------------- */
export async function getConversations() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  try {
    await connectDB();

    // Fetch conversations where I am the expert
    const conversations = await Conversation.find({
      expertId: session.user.id,
    })
      .populate({
        path: "userId", // Client
        model: User,
        select: "name image isOnline lastSeen",
      })
      .sort({ lastMessageAt: -1 })
      .lean();

    // Serialize + map for shared ChatClient
    const plainConversations = conversations.map((c) => ({
      _id: c._id.toString(),

      userId: c.userId?._id.toString(),
      expertId: c.expertId.toString(),

      // ✅ Standardized alias used by ChatClient
      otherUser: c.userId
        ? {
            _id: c.userId._id.toString(),
            name: c.userId.name,
            image: c.userId.image,
            profilePicture: c.userId.image, // compatibility
            isOnline: c.userId.isOnline,
            lastSeen: c.userId.lastSeen
              ? new Date(c.userId.lastSeen).toISOString()
              : null,
          }
        : null,

      lastMessage: c.lastMessage || null,
      lastMessageSender: c.lastMessageSender
        ? c.lastMessageSender.toString()
        : null,

      // ✅ Unread count relevant to EXPERT
      unreadCount: c.expertUnreadCount || 0,
      expertUnreadCount: c.expertUnreadCount || 0,

      lastMessageAt: c.lastMessageAt
        ? new Date(c.lastMessageAt).toISOString()
        : null,

      createdAt: c.createdAt
        ? new Date(c.createdAt).toISOString()
        : null,
    }));

    return JSON.parse(JSON.stringify(plainConversations));
  } catch (err) {
    console.error("[ChatAction] getConversations error:", err);
    return [];
  }
}

/* -----------------------------------------------------
 * 2. GET MESSAGES (Conversation Thread)
 * ----------------------------------------------------- */
export async function getMessages(conversationId) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  try {
    await connectDB();

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate({
        path: "replyTo",
        model: Message,
        select: "content contentType senderModel",
      })
      .lean();

    // Robust serialization (fixes ObjectId buffer issues)
    const plainMessages = messages.map((msg) => ({
      _id: msg._id.toString(),
      conversationId: msg.conversationId.toString(),

      sender: msg.sender ? msg.sender.toString() : null,
      senderModel: msg.senderModel,

      content: msg.content,
      contentType: msg.contentType,

      replyTo: msg.replyTo
        ? {
            _id: msg.replyTo._id.toString(),
            content: msg.replyTo.content,
            contentType: msg.replyTo.contentType,
            senderModel: msg.replyTo.senderModel,
          }
        : null,

      readBy: Array.isArray(msg.readBy)
        ? msg.readBy.map((id) => id.toString())
        : [],

      isDeleted: msg.isDeleted || false,

      createdAt: msg.createdAt
        ? new Date(msg.createdAt).toISOString()
        : null,
    }));

    return JSON.parse(JSON.stringify(plainMessages));
  } catch (err) {
    console.error("[ChatAction] getMessages error:", err);
    return [];
  }
}
