import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expertProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpertProfile",
      required: true,
    },
    appointmentDate: { type: Date, required: true },
    appointmentTime: { type: String, required: true }, // "14:30"
    serviceName: { type: String, required: true },
    appointmentType: { 
      type: String, 
      enum: ["Video Call", "Clinic Visit", "Chat", "Phone"],
      required: true 
    },
    duration: { type: Number, required: true },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "no-show"],
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    
    // REPLACED: meetingLink with meetingId (Crypto ID)
    meetingId: { 
      type: String,
      unique: true,
      sparse: true,
      index: true
    },

    cancellationReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);