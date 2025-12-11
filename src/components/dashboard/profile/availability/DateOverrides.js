"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar, Repeat, Trash2, X, CalendarOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function DateOverrides({ leaves, setLeaves }) {
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [recurring, setRecurring] = useState(false);

  const add = () => {
    if (!date) return;
    if (leaves.some(l => new Date(l.date).toDateString() === new Date(date).toDateString())) {
        toast.error("This date is already blocked.");
        return;
    }
    setLeaves([...leaves, { date: new Date(date), note: note || "Time Off", isRecurring: recurring }].sort((a,b) => new Date(a.date) - new Date(b.date)));
    setDate(""); setNote(""); setRecurring(false);
    toast.success("Date blocked.");
  };

  return (
    <Card className="border-zinc-200 shadow-sm bg-white rounded-xl overflow-hidden">
        <CardContent className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT: ADD FORM */}
            <div className="lg:col-span-5 space-y-5 bg-zinc-50/50 p-6 rounded-xl border border-zinc-100 h-fit">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">1. Select Date</Label>
                        <div className="date-input-wrapper">
                            <Input 
                                type="date" 
                                value={date} 
                                onChange={(e) => setDate(e.target.value)} 
                                className="bg-white h-11 border-zinc-200 cursor-pointer focus:border-indigo-500 transition-colors"
                                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">2. Reason (Optional)</Label>
                        <Input 
                            value={note} 
                            onChange={(e) => setNote(e.target.value)} 
                            placeholder="e.g. Doctor's Appointment" 
                            className="bg-white h-11 border-zinc-200"
                        />
                    </div>

                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-zinc-200/60">
                        <div className="flex items-center gap-2">
                            <Repeat className="h-4 w-4 text-zinc-400" />
                            <Label htmlFor="recur" className="text-sm font-medium text-zinc-700 cursor-pointer">Repeat Annually</Label>
                        </div>
                        <Switch id="recur" checked={recurring} onCheckedChange={setRecurring} className="data-[state=checked]:bg-indigo-600" />
                    </div>

                    <Button onClick={add} disabled={!date} className="w-full bg-zinc-900 text-white hover:bg-zinc-800 h-11 shadow-sm mt-2">
                        Add Blocked Date
                    </Button>
                </div>
            </div>

            {/* RIGHT: LIST */}
            <div className="lg:col-span-7">
                {leaves.length === 0 ? (
                    <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/30">
                        <CalendarOff className="h-8 w-8 text-zinc-300 mb-3" />
                        <p className="text-sm font-medium text-zinc-900">No dates blocked yet.</p>
                        <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">You are available according to your weekly schedule.</p>
                    </div>
                ) : (
                    <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                        {leaves.map((l, i) => {
                            const d = new Date(l.date);
                            return (
                                <div key={i} className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-lg shadow-sm hover:border-zinc-300 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("h-12 w-12 rounded-lg flex flex-col items-center justify-center border shrink-0", l.isRecurring ? "bg-indigo-50 border-indigo-100 text-indigo-700" : "bg-orange-50 border-orange-100 text-orange-700")}>
                                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{d.toLocaleString('default',{month:'short'})}</span>
                                            <span className="text-lg font-bold leading-none">{d.getDate()}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-zinc-900 truncate">{l.note}</p>
                                            <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                                                {d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}
                                                {l.isRecurring && <span className="bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded text-[9px] font-bold border border-zinc-200">YEARLY</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => {const n=[...leaves];n.splice(i,1);setLeaves(n)}} className="text-zinc-400 hover:text-red-600 hover:bg-red-50 shrink-0">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
  );
}