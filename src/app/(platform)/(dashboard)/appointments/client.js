"use client";

import { useState } from "react";
import {
  Clock,
  Video,
  MapPin,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  User as UserIcon,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { updateAppointmentStatus } from "@/actions/appointments";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AppointmentsClient({ initialData }) {
  const [appointments, setAppointments] = useState(initialData);
  const [loadingId, setLoadingId] = useState(null);

  /* -------------------------------------------------------
   * GROUP APPOINTMENTS
   * ----------------------------------------------------- */
  const upcoming = appointments.filter(
    a =>
      ["confirmed", "pending"].includes(a.status) &&
      new Date(a.appointmentDate) >= new Date()
  );

  const history = appointments.filter(
    a =>
      ["completed", "cancelled", "no-show"].includes(a.status) ||
      (new Date(a.appointmentDate) < new Date() && a.status !== "confirmed")
  );

  /* -------------------------------------------------------
   * ACTIONS
   * ----------------------------------------------------- */
  const handleStatusUpdate = async (id, status) => {
    setLoadingId(id);

    const res = await updateAppointmentStatus(id, status);

    if (res?.success) {
      toast.success(res.message);
      setAppointments(prev =>
        prev.map(a => (a._id === id ? { ...a, status } : a))
      );
    } else {
      toast.error(res?.message || "Something went wrong");
    }

    setLoadingId(null);
  };

  const handleJoinCall = appt => {
    if (appt.meetingId) {
      window.open(`/meet/${appt.meetingId}`, "_blank");
      return;
    }

    // Legacy fallback (safe to remove later)
    if (appt.meetingLink) {
      window.open(appt.meetingLink, "_blank");
      return;
    }

    toast.error("Video room not initialized.");
  };

  /* -------------------------------------------------------
   * CARD
   * ----------------------------------------------------- */
  const AppointmentCard = ({ appt }) => {
    const isVideo = appt.appointmentType === "Video Call";

    return (
      <Card className="mb-4 hover:border-zinc-300 transition-all">
        <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center gap-6">
          
          {/* DATE */}
          <div className="flex flex-col items-center justify-center bg-zinc-50 border rounded-lg p-3 w-full md:w-20 text-center shrink-0">
            <span className="text-xs font-bold text-zinc-400 uppercase">
              {format(new Date(appt.appointmentDate), "MMM")}
            </span>
            <span className="text-2xl font-bold text-zinc-900">
              {format(new Date(appt.appointmentDate), "dd")}
            </span>
            <span className="text-xs font-medium text-zinc-500">
              {format(new Date(appt.appointmentDate), "EEE")}
            </span>
          </div>

          {/* DETAILS */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="gap-1 bg-indigo-50 text-indigo-700 border-indigo-100">
                {isVideo ? (
                  <Video className="w-3 h-3" />
                ) : (
                  <MapPin className="w-3 h-3" />
                )}
                {appt.appointmentType}
              </Badge>

              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize border ${
                  appt.status === "confirmed"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : appt.status === "cancelled"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-zinc-100 text-zinc-600 border-zinc-200"
                }`}
              >
                {appt.status}
              </span>
            </div>

            <h3 className="font-bold text-lg text-zinc-900">
              {appt.serviceName}
            </h3>

            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {appt.appointmentTime} ({appt.duration}m)
              </div>

              <span className="font-medium text-zinc-900">
                ₹{appt.price}
              </span>

              {isVideo && appt.meetingId && (
                <span className="hidden md:inline text-xs text-zinc-400 font-mono bg-zinc-50 px-2 py-0.5 rounded">
                  ID: {appt.meetingId.slice(0, 8)}…
                </span>
              )}
            </div>
          </div>

          {/* CLIENT */}
          <div className="flex items-center gap-3 bg-zinc-50 p-2 pr-4 rounded-full border shrink-0">
            <Avatar className="w-10 h-10 border bg-white">
              <AvatarImage src={appt.userId?.image} />
              <AvatarFallback>
                <UserIcon className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>

            <div className="text-sm">
              <p className="font-semibold text-zinc-900">
                {appt.userId?.name || "Guest User"}
              </p>
              <p className="text-xs text-zinc-500">Client</p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-2 self-end md:self-center">
            {appt.status === "confirmed" && (
              <>
                {isVideo && (
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => handleJoinCall(appt)}
                    disabled={!appt.meetingId && !appt.meetingLink}
                  >
                    Join Call
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      disabled={loadingId === appt._id}
                      onClick={() =>
                        handleStatusUpdate(appt._id, "completed")
                      }
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                      Mark Completed
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      disabled={loadingId === appt._id}
                      onClick={() =>
                        handleStatusUpdate(appt._id, "cancelled")
                      }
                      className="text-red-600"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Session
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  /* -------------------------------------------------------
   * RENDER
   * ----------------------------------------------------- */
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
        <p className="text-zinc-500">
          Manage your upcoming sessions and view history.
        </p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="bg-zinc-100 p-1 rounded-lg mb-6">
          <TabsTrigger value="upcoming">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcoming.length ? (
            upcoming.map(appt => (
              <AppointmentCard key={appt._id} appt={appt} />
            ))
          ) : (
            <EmptyState text="No upcoming appointments found." />
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {history.length ? (
            history.map(appt => (
              <AppointmentCard key={appt._id} appt={appt} />
            ))
          ) : (
            <EmptyState text="No past appointments." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------------------------------------
 * EMPTY STATE
 * ----------------------------------------------------- */
function EmptyState({ text }) {
  return (
    <div className="text-center py-12 border-2 border-dashed rounded-xl">
      <p className="text-zinc-500">{text}</p>
    </div>
  );
}
