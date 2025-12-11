"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Trash2, Plus, Zap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function AvailabilitySection({ availability, setAvailability }) {
  
  const addSlot = () => setAvailability([...availability, { dayOfWeek: "Monday", startTime: "09:00", endTime: "17:00" }]);
  
  // UX WIN: Bulk Add
  const fillStandardHours = () => {
    const standardWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => ({
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00"
    }));
    setAvailability([...availability, ...standardWeek]);
  };

  const updateSlot = (index, field, value) => {
    const newSlots = [...availability];
    newSlots[index][field] = value;
    setAvailability(newSlots);
  };
  
  const removeSlot = (index) => setAvailability(availability.filter((_, i) => i !== index));

  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                  <CardTitle>Weekly Schedule</CardTitle>
                  <CardDescription>Set your recurring hours. Times are in your local timezone.</CardDescription>
              </div>
              <div className="flex gap-2">
                  {/* Quick Action */}
                  {availability.length === 0 && (
                      <Button type="button" onClick={fillStandardHours} variant="outline" size="sm" className="bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100">
                          <Zap className="h-3.5 w-3.5 mr-2" /> Fill 9-5 (Mon-Fri)
                      </Button>
                  )}
                  <Button type="button" onClick={addSlot} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2"/> Add Slot
                  </Button>
              </div>
          </div>
      </CardHeader>
      <CardContent className="space-y-4">
          
          {availability.length === 0 ? (
              <div className="text-center py-10 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                  <p className="text-zinc-500 text-sm">No hours set. You won't be bookable.</p>
              </div>
          ) : (
              <div className="space-y-3">
                  {availability.map((slot, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border border-zinc-200 rounded-xl bg-white shadow-sm transition-all group hover:border-zinc-300">
                          <div className="flex items-center gap-2 w-full sm:w-48">
                              <Select value={slot.dayOfWeek} onValueChange={(val) => updateSlot(idx, 'dayOfWeek', val)}>
                                  <SelectTrigger className="font-medium">
                                      <SelectValue/>
                                  </SelectTrigger>
                                  <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                              </Select>
                          </div>
                          <div className="flex items-center gap-3 flex-1">
                              <Input type="time" value={slot.startTime} onChange={(e) => updateSlot(idx, 'startTime', e.target.value)} />
                              <span className="text-zinc-400 text-xs font-bold">TO</span>
                              <Input type="time" value={slot.endTime} onChange={(e) => updateSlot(idx, 'endTime', e.target.value)} />
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeSlot(idx)} className="text-zinc-300 hover:text-red-500">
                              <Trash2 className="h-4 w-4"/>
                          </Button>
                      </div>
                  ))}
              </div>
          )}
      </CardContent>
    </Card>
  );
}