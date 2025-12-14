import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, required: true, refPath: "senderModel" },
    senderModel: { type: String, required: true, enum: ["User", "Expert"] },
    content: { type: String, required: true, trim: true },
    contentType: { type: String, enum: ["text", "image", "audio", "pdf"], default: "text" },
    replyTo: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    readBy: [{ type: Schema.Types.ObjectId }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });
export default mongoose.models.Message || mongoose.model("Message", MessageSchema);