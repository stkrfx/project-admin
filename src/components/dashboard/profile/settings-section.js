"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import { Globe, Link as LinkIcon, Linkedin, Twitter, LayoutGrid, MapPin } from "lucide-react";

// Standard Australian Timezones
const TIMEZONES = [
  "Australia/Sydney", 
  "Australia/Melbourne", 
  "Australia/Brisbane",
  "Australia/Adelaide", 
  "Australia/Perth", 
  "Australia/Darwin", 
  "Australia/Hobart"
];

export function SettingsSection({ expert, languages, setLanguages }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* REGION SETTINGS */}
        <Card className="border-zinc-200 shadow-sm h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Globe className="h-4 w-4 text-sky-500" />
                    Region & Preferences
                </CardTitle>
                <CardDescription>Set where you operate and what languages you speak.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select name="timezone" defaultValue={expert?.timezone || "Australia/Sydney"}>
                        <SelectTrigger className="bg-zinc-50/50">
                            <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                            {TIMEZONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <p className="text-[10px] text-zinc-500">
                        ⚠️ Important: Your calendar availability is calculated based on this timezone.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Location</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <Input 
                            name="location" 
                            defaultValue={expert?.location} 
                            placeholder="City, Country" 
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Languages Spoken (Press Enter)</Label>
                    <TagInput 
                        placeholder="Add language (e.g. Mandarin)..." 
                        tags={languages} 
                        setTags={setLanguages} 
                    />
                </div>
            </CardContent>
        </Card>

        {/* SOCIAL LINKS */}
        <Card className="border-zinc-200 shadow-sm h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <LinkIcon className="h-4 w-4 text-pink-500" />
                    Social Presence
                </CardTitle>
                <CardDescription>Links displayed on your public profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
                        <Linkedin className="h-3.5 w-3.5 text-blue-600" /> LinkedIn
                    </Label>
                    <Input 
                        name="linkedin" 
                        defaultValue={expert?.socialLinks?.linkedin} 
                        placeholder="https://linkedin.com/in/username" 
                    />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
                        <Twitter className="h-3.5 w-3.5 text-sky-500" /> Twitter / X
                    </Label>
                    <Input 
                        name="twitter" 
                        defaultValue={expert?.socialLinks?.twitter} 
                        placeholder="https://twitter.com/username" 
                    />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
                        <LayoutGrid className="h-3.5 w-3.5 text-zinc-500" /> Personal Website
                    </Label>
                    <Input 
                        name="website" 
                        defaultValue={expert?.socialLinks?.website} 
                        placeholder="https://yourwebsite.com" 
                    />
                </div>
            </CardContent>
        </Card>
    </div>
  );
}