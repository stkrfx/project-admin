import mongoose, { Schema } from "mongoose";

const ConversationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expertId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lastMessage: { type: String, default: null },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastMessageSender: { type: Schema.Types.ObjectId, ref: "User" },
    lastMessageStatus: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
    userUnreadCount: { type: Number, default: 0 },
    expertUnreadCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ConversationSchema.index({ userId: 1, expertId: 1 }, { unique: true });
export default mongoose.models.Conversation || mongoose.model("Conversation", ConversationSchema);