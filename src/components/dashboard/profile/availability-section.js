"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  Plus,
  Trash2,
  Copy,
  ArrowRight,
  Calendar,
  CalendarOff,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function AvailabilitySection({
  availability,
  setAvailability,
  leaves,
  setLeaves,
}) {
  // --------------------------
  //   AVAILABILITY LOGIC
  // --------------------------

  const getDaySlots = (day) =>
    availability
      .filter((slot) => slot.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const toggleDay = (day, active) => {
    if (active) {
      // Add default 9–5
      setAvailability([
        ...availability,
        { dayOfWeek: day, startTime: "09:00", endTime: "17:00" },
      ]);
    } else {
      setAvailability(
        availability.filter((slot) => slot.dayOfWeek !== day)
      );
    }
  };

  const updateSlot = (day, index, field, value) => {
    const daySlots = getDaySlots(day);
    const slotToUpdate = daySlots[index];
    const globalIndex = availability.indexOf(slotToUpdate);
    if (globalIndex === -1) return;

    const updated = [...availability];
    updated[globalIndex][field] = value;
    setAvailability(updated);
  };

  const addPeriod = (day) => {
    setAvailability([
      ...availability,
      { dayOfWeek: day, startTime: "13:00", endTime: "17:00" },
    ]);
  };

  const removePeriod = (day, index) => {
    const slots = getDaySlots(day);
    const target = slots[index];
    setAvailability(availability.filter((s) => s !== target));
  };

  const copyFromMonday = () => {
    const mondaySlots = getDaySlots("Monday");
    if (!mondaySlots.length) return toast.error("Monday has no slots to copy.");

    const targetDays = ["Tuesday", "Wednesday", "Thursday", "Friday"];

    let newData = availability.filter(
      (s) => !targetDays.includes(s.dayOfWeek)
    );

    targetDays.forEach((day) => {
      mondaySlots.forEach((slot) => {
        newData.push({
          dayOfWeek: day,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
      });
    });

    setAvailability(newData);
    toast.success("Copied Monday to Tue–Fri");
  };

  // --------------------------
  //        LEAVES LOGIC
  // --------------------------

  const [newLeave, setNewLeave] = useState("");

  const addLeave = () => {
    if (!newLeave) return;
    const dateObj = new Date(newLeave);

    if (
      leaves.some(
        (d) => new Date(d).toDateString() === dateObj.toDateString()
      )
    ) {
      return toast.error("Date already blocked.");
    }

    setLeaves([...leaves, dateObj]);
    setNewLeave("");
  };

  const removeLeave = (i) => {
    const updated = [...leaves];
    updated.splice(i, 1);
    setLeaves(updated);
  };

  return (
    <Card className="border-zinc-200 shadow-sm overflow-hidden bg-white">
      {/* Remove default time input icon */}
      <style jsx global>{`
        input[type="time"]::-webkit-calendar-picker-indicator {
          display: none !important;
        }
      `}</style>

      <Tabs defaultValue="weekly" className="w-full">
        {/* HEADER */}
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-zinc-900">
              <Clock className="h-5 w-5 text-indigo-600" />
              Availability & Time Off
            </CardTitle>
            <CardDescription>
              Configure your recurring hours and blocked dates.
            </CardDescription>
          </div>

          {/* NEWrounded tabs */}
          <TabsList className="grid w-full sm:w-auto grid-cols-2 bg-zinc-100 p-1 rounded-xl">
            <TabsTrigger
              value="weekly"
              className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Weekly Hours
            </TabsTrigger>
            <TabsTrigger
              value="leaves"
              className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Time Off ({leaves.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ---------------------------------------------- */}
        {/*                WEEKLY SCHEDULE                 */}
        {/* ---------------------------------------------- */}
        <TabsContent value="weekly" className="m-0 p-0">
          <div className="divide-y divide-zinc-100">
            {DAYS.map((day) => {
              const slots = getDaySlots(day);
              const active = slots.length > 0;

              return (
                <div
                  key={day}
                  className={cn(
                    "group p-5 hover:bg-zinc-50 flex gap-6 transition-colors",
                    active ? "opacity-100" : "opacity-60"
                  )}
                >
                  {/* LEFT COLUMN — FIXED WIDTH */}
                  <div className="w-[140px] shrink-0">
                    <Label className="text-sm font-bold text-zinc-900 mb-1 block">
                      {day}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={active}
                        onCheckedChange={(c) => toggleDay(day, c)}
                      />
                      <span className="text-xs text-zinc-500">
                        {active ? "Available" : "Closed"}
                      </span>
                    </div>
                  </div>

                  {/* TIME SLOTS */}
                  <div className="flex-1 space-y-3">
                    {active ? (
                      slots.map((slot, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 animate-in fade-in zoom-in-95"
                        >
                          {/* TIME INPUT GROUP */}
                          <div className="flex items-center bg-white border border-zinc-200 rounded-lg shadow-sm px-3 h-10 hover:border-zinc-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) =>
                                updateSlot(day, i, "startTime", e.target.value)
                              }
                              className="w-[90px] bg-transparent text-sm font-semibold text-zinc-900 text-center outline-none font-mono"
                            />
                            <ArrowRight className="h-3 w-3 text-zinc-300 mx-2" />
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) =>
                                updateSlot(day, i, "endTime", e.target.value)
                              }
                              className="w-[90px] bg-transparent text-sm font-semibold text-zinc-900 text-center outline-none font-mono"
                            />
                          </div>

                          {/* REMOVE SLOT */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePeriod(day, i)}
                            className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-zinc-400 italic">
                        No hours added.
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN — ACTIONS */}
                  {active && (
                    <div className="flex items-start gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addPeriod(day)}
                        className="h-8 px-3 text-xs border-zinc-300 hover:border-zinc-400"
                      >
                        <Plus className="h-3 w-3" /> Slot
                      </Button>

                      {day === "Monday" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={copyFromMonday}
                          className="h-8 w-8 text-zinc-400 hover:text-zinc-900"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ---------------------------------------------- */}
        {/*                    LEAVES                      */}
        {/* ---------------------------------------------- */}
        <TabsContent value="leaves" className="m-0 p-0">
          <CardContent className="space-y-8 p-8">
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center">
                <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CalendarOff className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-zinc-900">Block Dates</h3>
                <p className="text-sm text-zinc-500">
                  Mark days when you're unavailable for appointments.
                </p>
              </div>

              {/* ADD LEAVE */}
              <div className="flex gap-3 bg-zinc-50 p-2 rounded-xl border border-zinc-200">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    type="date"
                    value={newLeave}
                    onChange={(e) => setNewLeave(e.target.value)}
                    className="pl-10 bg-white border-zinc-200"
                  />
                </div>

                <Button
                  onClick={addLeave}
                  disabled={!newLeave}
                  className="bg-zinc-900 text-white hover:bg-zinc-800"
                >
                  Block
                </Button>
              </div>

              {/* LIST OF LEAVES */}
              <div className="space-y-2">
                {leaves.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-zinc-200 rounded-lg bg-zinc-50">
                    <p className="text-xs text-zinc-400">
                      No blocked dates yet.
                    </p>
                  </div>
                ) : (
                  leaves.map((date, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-white border border-zinc-200 p-3 rounded-lg shadow-sm hover:border-orange-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-orange-50 text-orange-600 rounded-md flex items-center justify-center font-bold text-xs">
                          {new Date(date).getDate()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-800">
                            {new Date(date).toLocaleDateString("en-US", {
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {new Date(date).toLocaleDateString("en-US", {
                              weekday: "long",
                            })}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLeave(i)}
                        className="h-8 w-8 text-zinc-300 hover:text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
