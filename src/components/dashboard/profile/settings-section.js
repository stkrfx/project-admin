"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Clock, Trash2, AlertTriangle, Languages } from "lucide-react";
import { TagInput } from "@/components/ui/tag-input";
import { toast } from "sonner";

const TIMEZONES = [
  "Pacific/Midway", "US/Hawaii", "US/Alaska", "US/Pacific", "US/Mountain", "US/Central", "US/Eastern",
  "Canada/Atlantic", "America/Buenos_Aires", "UTC", "Europe/London", "Europe/Paris", "Europe/Berlin",
  "Europe/Istanbul", "Africa/Cairo", "Africa/Johannesburg", "Asia/Jerusalem", "Asia/Dubai", "Asia/Kolkata",
  "Asia/Bangkok", "Asia/Singapore", "Asia/Shanghai", "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland"
];

export function SettingsSection({ expert, languages, setLanguages }) {
  // We manage timezone locally for the UI, but inject a hidden input 
  // so the parent form picks it up automatically during submission.
  const [timezone, setTimezone] = useState(expert?.timezone || "Australia/Sydney");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. GLOBAL PREFERENCES */}
      <Card className="border-zinc-200 shadow-sm bg-white">
        <CardHeader className="bg-zinc-50/30 border-b border-zinc-100 pb-6">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white rounded-xl border border-zinc-200 flex items-center justify-center shadow-sm text-zinc-700">
                    <Globe className="h-5 w-5" />
                </div>
                <div>
                    <CardTitle className="text-lg font-bold text-zinc-900">Global Preferences</CardTitle>
                    <CardDescription>Manage your localization and language settings.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Languages */}
                <div className="space-y-3">
                    <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wide flex items-center gap-2">
                        <Languages className="h-3.5 w-3.5" /> Spoken Languages
                    </Label>
                    <TagInput 
                        placeholder="Add a language (e.g. English, French)..." 
                        tags={languages} 
                        setTags={setLanguages}
                        className="bg-white min-h-[44px] border-zinc-200 focus-within:ring-indigo-500" 
                    />
                    <p className="text-xs text-zinc-500">
                        These will be displayed on your profile to help match with relevant clients.
                    </p>
                </div>

                {/* Timezone */}
                <div className="space-y-3">
                    <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wide flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" /> Timezone
                    </Label>
                    
                    {/* Hidden Input for Form Submission */}
                    <input type="hidden" name="timezone" value={timezone} />
                    
                    <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger className="h-11 bg-white border-zinc-200 focus:ring-indigo-500">
                            <SelectValue placeholder="Select your timezone" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {TIMEZONES.map((tz) => (
                                <SelectItem key={tz} value={tz}>{tz.replace("_", " ")}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-zinc-500">
                        Your availability will be calculated based on this timezone.
                    </p>
                </div>
            </div>

        </CardContent>
      </Card>

      {/* 2. DANGER ZONE */}
      <Card className="border-red-100 shadow-sm bg-red-50/10 overflow-hidden">
        <CardHeader className="border-b border-red-100 bg-red-50/30 pb-6">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white rounded-xl border border-red-100 flex items-center justify-center shadow-sm text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                    <CardTitle className="text-lg font-bold text-red-900">Danger Zone</CardTitle>
                    <CardDescription className="text-red-700/80">Irreversible account actions.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-900">Deactivate Profile</h4>
                <p className="text-sm text-zinc-500 max-w-md">
                    Temporarily hide your profile from the public marketplace. You can reactivate it anytime.
                </p>
            </div>
            <Button 
                variant="outline" 
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 bg-white"
                onClick={() => toast.error("Deactivation is restricted for active experts.")}
            >
                Deactivate Account
            </Button>
        </CardContent>
        <div className="h-px bg-red-100 w-full" />
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-900">Delete Account</h4>
                <p className="text-sm text-zinc-500 max-w-md">
                    Permanently delete your account and all associated data. This action cannot be undone.
                </p>
            </div>
            <Button 
                variant="destructive" 
                className="bg-red-600 hover:bg-red-700 shadow-sm"
                onClick={() => toast.error("Please contact support to delete your account.")}
            >
                <Trash2 className="h-4 w-4 mr-2" /> Delete Account
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}