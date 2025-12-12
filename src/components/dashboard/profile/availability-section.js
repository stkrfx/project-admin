"use client";

import { Info, CalendarClock, CalendarDays, AlertCircle } from "lucide-react";
import { WeeklySchedule } from "./availability/WeeklySchedule";
import { DateOverrides } from "./availability/DateOverrides";

export function AvailabilitySection({ availability, setAvailability, leaves, setLeaves, errors = {} }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* GLOBAL STYLES: Clean Inputs */}
      <style jsx global>{`
        /* Remove ugly browser defaults */
        input[type="time"]::-webkit-calendar-picker-indicator { background: none; display: none; }
        input[type="time"] { appearance: none; }
        
        /* Fix Date Picker Icon */
        .date-input-wrapper { position: relative; width: 100%; }
        .date-input-wrapper input[type="date"] { padding-right: 40px; }
        .date-input-wrapper input[type="date"]::-webkit-calendar-picker-indicator {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            opacity: 0.5;
            padding: 4px;
        }
        .date-input-wrapper input[type="date"]::-webkit-calendar-picker-indicator:hover { opacity: 1; }
      `}</style>

      {/* GLOBAL ERROR FOR AVAILABILITY */}
      {(errors.availability || errors.leaves) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium animate-pulse">
            <AlertCircle className="h-4 w-4" />
            {errors.availability || errors.leaves || "Please check your schedule settings."}
        </div>
      )}

      {/* --- IMPROVED INFO SECTION --- */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
            
            {/* Left: Intro */}
            <div className="flex-1 space-y-2">
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    <Info className="h-4 w-4 text-indigo-600" />
                    How Availability Works
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                    Your availability is calculated in two layers. Clients can only book times that are open in your <strong>Weekly Schedule</strong> AND not blocked by a <strong>Date Override</strong>.
                </p>
            </div>

            {/* Right: Key Details */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 uppercase tracking-wide">
                        <CalendarClock className="h-3.5 w-3.5 text-indigo-500" />
                        Layer 1: Weekly
                    </div>
                    <p className="text-xs text-zinc-500">
                        Set your standard recurring hours (e.g. Mon-Fri, 9am-5pm).
                    </p>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 uppercase tracking-wide">
                        <CalendarDays className="h-3.5 w-3.5 text-orange-500" />
                        Layer 2: Overrides
                    </div>
                    <p className="text-xs text-zinc-500">
                        Block specific dates for holidays, sick leave, or vacations.
                    </p>
                </div>
            </div>
        </div>

        {/* Important Notice Footer */}
        <div className="mt-4 pt-4 border-t border-zinc-100 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
            <p className="text-xs text-zinc-600 font-medium">
                Note: To prevent conflicts with existing appointments, changes you make now will apply automatically starting <strong>Tomorrow</strong>. Today's schedule remains locked.
            </p>
        </div>
      </div>

      {/* --- SECTION 1: WEEKLY --- */}
      <div className="space-y-4">
        <div className="px-1">
            <h3 className="text-lg font-bold text-zinc-900">1. Weekly Recurring Schedule</h3>
            <p className="text-sm text-zinc-500">Define your standard work week.</p>
        </div>
        <WeeklySchedule 
            availability={availability} 
            setAvailability={setAvailability} 
        />
      </div>

      {/* --- SECTION 2: OVERRIDES --- */}
      <div className="space-y-4 pt-8 border-t border-zinc-200/60">
        <div className="px-1">
            <h3 className="text-lg font-bold text-zinc-900">2. Date Overrides & Time Off</h3>
            <p className="text-sm text-zinc-500">Add exceptions for specific dates.</p>
        </div>
        <DateOverrides 
            leaves={leaves} 
            setLeaves={setLeaves} 
        />
      </div>
    </div>
  );
}