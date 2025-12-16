"use client";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, X, Copy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function WeeklySchedule({ availability, setAvailability }) {

    const getDaySlots = (day) => 
        availability
          .filter(s => s.dayOfWeek === day)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      // --- OVERLAP CHECK HELPER ---
      const checkOverlap = (day, newStart, newEnd, ignoreIndex = -1) => {
        const daySlots = getDaySlots(day);
        return daySlots.some((slot, idx) => {
            // Skip the slot we are currently editing
            if (idx === ignoreIndex) return false;
            
            // Overlap condition: (StartA < EndB) and (EndA > StartB)
            // Using string comparison works for HH:MM format
            return newStart < slot.endTime && newEnd > slot.startTime;
        });
      };
      
const toggleDay = (day, active) => {
  if (active) {
      // Default to 09:00 - 17:00 if enabling, but check overlap just in case 
      // (unlikely if it was empty, but good practice)
      setAvailability([...availability, { dayOfWeek: day, startTime: "09:00", endTime: "17:00" }]);
  } else {
      setAvailability(availability.filter(s => s.dayOfWeek !== day));
  }
};

const updateSlot = (day, index, field, value) => {
  const daySlots = getDaySlots(day);
  const slotToUpdate = daySlots[index];
  
  // Find the actual slot object in the main availability array
  const globalIndex = availability.indexOf(slotToUpdate);
  if (globalIndex === -1) return;

  // Calculate proposed new time range
  const newStart = field === 'startTime' ? value : slotToUpdate.startTime;
  const newEnd = field === 'endTime' ? value : slotToUpdate.endTime;

  // 1. Check for Overlaps with other slots on the same day
  if (checkOverlap(day, newStart, newEnd, index)) {
      toast.error("Time slots cannot overlap with existing timings.");
      return; // Block the update
  }

  // 2. Update State
  const newAv = [...availability];
  newAv[globalIndex][field] = value;
  setAvailability(newAv);
};

const addSlot = (day) => {
  const daySlots = getDaySlots(day);
  
  // --- SMART ADD LOGIC ---
  let newStart = "09:00";
  
  if (daySlots.length > 0) {
      // Find the latest end time among existing slots to append after
      const maxEnd = daySlots.reduce((max, s) => s.endTime > max ? s.endTime : max, "00:00");
      newStart = maxEnd;
  }

  // Calculate End Time (Start + 1 Hour)
  const [h, m] = newStart.split(':').map(Number);
  let nextH = h + 1;
  
  // Simple cap at 23:00 to prevent invalid hours
  if (nextH > 23) {
     toast.error("Cannot add slot: End of day reached.");
     return;
  }
  
  const newEnd = `${nextH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

  // Validate Overlap before adding
  if (checkOverlap(day, newStart, newEnd)) {
       toast.error("New slot overlaps with existing timings.");
       return;
  }

  setAvailability([...availability, { dayOfWeek: day, startTime: newStart, endTime: newEnd }]);
};

const removeSlot = (day, index) => {
    const slotToRemove = getDaySlots(day)[index];
    setAvailability(availability.filter(s => s !== slotToRemove));
};

const copyToWeekdays = (sourceDay) => {
  const sourceSlots = getDaySlots(sourceDay);
  if (!sourceSlots.length) return;
  const targets = ["Tuesday", "Wednesday", "Thursday", "Friday"];
  
  // Remove existing slots for targets to overwrite clean
  let newAv = availability.filter(s => !targets.includes(s.dayOfWeek));
  
  targets.forEach(d => {
      sourceSlots.forEach(s => {
          newAv.push({ dayOfWeek: d, startTime: s.startTime, endTime: s.endTime });
      });
  });
  setAvailability(newAv);
  toast.success("Schedule copied to Tue-Fri");
};

    return (
        <Card className="border-zinc-200 shadow-sm bg-white rounded-xl overflow-hidden">
            <div className="divide-y divide-zinc-100">
                {DAYS.map((day) => {
                    const slots = getDaySlots(day);
                    const isActive = slots.length > 0;

                    return (
                        <div key={day} className={cn(
                            "p-5 transition-all duration-200 hover:bg-zinc-50/50",
                            !isActive && "opacity-60 bg-zinc-50/30"
                        )}>
                            <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">

                                {/* Day Toggle */}
                                <div className="w-full md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start justify-between">
                                    <Label className="text-base font-bold text-zinc-900 cursor-pointer select-none">{day}</Label>
                                    <div className="flex items-center gap-3 mt-0 md:mt-2">
                                        <Switch checked={isActive} onCheckedChange={(c) => toggleDay(day, c)} className="data-[state=checked]:bg-indigo-600" />
                                        <span className="text-xs font-medium text-zinc-500 md:hidden">{isActive ? "Available" : "Unavailable"}</span>
                                    </div>
                                </div>

                                {/* Time Slots */}
                                <div className="flex-1 w-full min-w-0">
                                    {isActive ? (
                                        <div className="flex flex-wrap gap-3">
                                            {slots.map((slot, idx) => (
                                                <div key={idx} className="flex items-center bg-white border border-zinc-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-500 transition-all overflow-hidden h-10 w-full sm:w-auto">
                                                    <input type="time" value={slot.startTime} onChange={(e) => updateSlot(day, idx, 'startTime', e.target.value)} className="w-full sm:w-[90px] h-full bg-transparent text-sm text-center font-medium text-zinc-900 focus:bg-zinc-50 outline-none cursor-pointer px-2" />
                                                    <div className="h-full w-px bg-zinc-100 flex items-center justify-center"><ArrowRight className="h-3 w-3 text-zinc-300" /></div>
                                                    <input type="time" value={slot.endTime} onChange={(e) => updateSlot(day, idx, 'endTime', e.target.value)} className="w-full sm:w-[90px] h-full bg-transparent text-sm text-center font-medium text-zinc-900 focus:bg-zinc-50 outline-none cursor-pointer px-2" />
                                                    <button type="button" onClick={() => removeSlot(day, idx)} className="h-full px-3 text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors border-l border-zinc-100"><X className="h-4 w-4" /></button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" onClick={() => addSlot(day)} className="h-10 border-dashed border-zinc-300 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 gap-1.5"><Plus className="h-3.5 w-3.5" /><span className="text-xs">Add Slot</span></Button>
                                        </div>
                                    ) : (
                                        <div className="h-10 flex items-center"><p className="text-sm text-zinc-400 italic">No time slots added.</p></div>
                                    )}
                                </div>

                                {/* Copy Action */}
                                {isActive && day === "Monday" && (
                                    <div className="w-full md:w-auto mt-2 md:mt-0 flex justify-end">
                                        <Button type="button" variant="ghost" size="sm" onClick={() => copyToWeekdays(day)} className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-9"><Copy className="h-3.5 w-3.5 mr-2" />Copy to Weekdays</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}