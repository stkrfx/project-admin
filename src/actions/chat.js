/*
 * File: src/actions/chat.js
 * ACTION: Expert-side Chat Logic
 * Architecture: User ↔ User (Expert is a User with ExpertProfile)
 *
 * Guarantees:
 * - RSC-safe serialization
 * - Ownership enforcement (expert-only access)
 * - Shared ChatClient compatibility
 * - Socket + optimistic UI friendly
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

    const plainConversations = conversations.map((c) => ({
      _id: c._id.toString(),

      userId: c.userId?._id.toString(),
      expertId: c.expertId.toString(),

      // ✅ Shared ChatClient contract
      otherUser: c.userId
        ? {
            _id: c.userId._id.toString(),
            name: c.userId.name,
            image: c.userId.image,
            profilePicture: c.userId.image,
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

    // ✅ OWNERSHIP GUARD (critical)
    const conversation = await Conversation.findOne({
      _id: conversationId,
      expertId: session.user.id,
    });

    if (!conversation) return [];

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate({
        path: "replyTo",
        model: Message,
        select: "content contentType senderModel",
      })
      .lean();

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

      isDeleted: msg.isDeleted === true,

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

/* -----------------------------------------------------
 * 3. GET SINGLE CONVERSATION (Socket / Realtime)
 * ----------------------------------------------------- */
export async function getConversationById(conversationId) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  try {
    await connectDB();

    const conversation = await Conversation.findOne({
      _id: conversationId,
      expertId: session.user.id, // ✅ Expert ownership enforced
    })
      .populate({
        path: "userId",
        model: User,
        select: "name image isOnline lastSeen",
      })
      .lean();

    if (!conversation) return null;

    return JSON.parse(
      JSON.stringify({
        _id: conversation._id.toString(),

        userId: conversation.userId?._id.toString(),
        expertId: conversation.expertId.toString(),

        // ✅ Shared ChatClient contract
        otherUser: conversation.userId
          ? {
              _id: conversation.userId._id.toString(),
              name: conversation.userId.name,
              image: conversation.userId.image,
              profilePicture: conversation.userId.image,
              isOnline: conversation.userId.isOnline,
              lastSeen: conversation.userId.lastSeen
                ? new Date(conversation.userId.lastSeen).toISOString()
                : null,
            }
          : null,

        lastMessage: conversation.lastMessage || null,
        lastMessageSender: conversation.lastMessageSender
          ? conversation.lastMessageSender.toString()
          : null,

        unreadCount: conversation.expertUnreadCount || 0,
        expertUnreadCount: conversation.expertUnreadCount || 0,

        lastMessageAt: conversation.lastMessageAt
          ? new Date(conversation.lastMessageAt).toISOString()
          : null,

        createdAt: conversation.createdAt
          ? new Date(conversation.createdAt).toISOString()
          : null,
      })
    );
  } catch (err) {
    console.error("[ChatAction] getConversationById error:", err);
    return null;
  }
}
