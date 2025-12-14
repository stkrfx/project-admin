/*
 * File: src/models/Message.js
 * ROLE: Unified Chat Message Model (User ↔ Expert)
 * SUPPORTS: Text, Images, Audio (Voice Notes), PDFs, Replies
 */

import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    // Sender ID (always a User ID in unified auth system)
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ CRITICAL: Distinguish Expert vs User
    senderModel: {
      type: String,
      enum: ["User", "Expert"],
      default: "Expert", // project-admin always sends as Expert
      required: true,
    },

    // Message content OR uploaded file URL
    content: {
      type: String,
      required: true,
      trim: true,
    },

    // ✅ CRITICAL: Rich media support
    contentType: {
      type: String,
      enum: ["text", "image", "audio", "pdf", "video"],
      default: "text",
    },

    // ✅ Reply support
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // Read receipts
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Soft delete (WhatsApp-style)
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// 🔍 Optimized indexes
MessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);
