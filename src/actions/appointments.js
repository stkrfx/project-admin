"use server";

import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import User from "@/models/User"; // To populate client details
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getExpertAppointments() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    // Fetch appointments where 'expertId' matches the logged-in user
    const appointments = await Appointment.find({ expertId: session.user.id })
      .populate("userId", "name email image") // Get client info
      .sort({ appointmentDate: -1 }) // Newest first
      .lean();

    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(appointments)) 
    };
  } catch (error) {
    console.error("Fetch Appointments Error:", error);
    return { success: false, data: [] };
  }
}

export async function updateAppointmentStatus(appointmentId, newStatus) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    const appointment = await Appointment.findOne({ 
      _id: appointmentId, 
      expertId: session.user.id 
    });

    if (!appointment) return { success: false, message: "Appointment not found" };

    appointment.status = newStatus;
    await appointment.save();

    revalidatePath("/appointments");
    return { success: true, message: `Appointment ${newStatus}` };
  } catch (error) {
    return { success: false, message: "Update failed" };
  }
}