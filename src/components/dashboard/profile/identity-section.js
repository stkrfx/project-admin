"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadButton } from "@/components/upload-button";
import { User, Wand2, AtSign, MapPin, Camera, Sparkles, Globe, Mail, Linkedin, Twitter, Link as LinkIcon, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function IdentitySection({ user, setUserName, setUserUsername, setUserImage, expert, setGender, setLocation, socialLinks, setSocialLinks, errors = {} }) {
    const [isHovered, setIsHovered] = useState(false);

    const generateUsername = () => {
        if (!user.name) return toast.error("Please enter your name first.");
        const random = Math.floor(Math.random() * 1000);
        const slug = user.name.toLowerCase().replace(/[^a-z0-9]/g, '') + random;
        setUserUsername(slug);
        toast.success("New username generated!");
    };

    const updateSocial = (key, val) => {
        setSocialLinks({ ...socialLinks, [key]: val });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">

            {/* --- LEFT: LIVE PREVIEW --- */}
            <div className="lg:col-span-4 space-y-6">
                <div className="sticky top-24">
                    <Card className="overflow-hidden border-zinc-200 shadow-sm">
                        {/* Banner */}
                        <div className="h-32 bg-gradient-to-br from-zinc-100 to-zinc-200 border-b border-zinc-200 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                        </div>

                        <CardContent className="px-6 pb-8 text-center relative">
                            {/* Avatar */}
                            <div
                                className="relative -mt-16 mb-4 inline-block group"
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                            >
                                <Avatar className="h-32 w-32 border-[6px] border-white shadow-xl cursor-pointer transition-transform duration-300 group-hover:scale-105 bg-zinc-50">
                                    <AvatarImage src={user.image || ""} className="object-cover" />
                                    <AvatarFallback className="text-4xl font-bold text-zinc-400 bg-zinc-100">
                                        {user.name?.[0]?.toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Overlay */}
                                <div className={cn("absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full transition-opacity duration-200 border-[6px] border-transparent", isHovered ? "opacity-100" : "opacity-0")}>
                                    <Camera className="h-6 w-6 text-white mb-1" />
                                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">Change</span>
                                    <div className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                                        <UploadButton
                                            endpoint="profilePicture" // <--- FIXED: Must match core.js router key
                                            onClientUploadComplete={(res) => {
                                                if (res?.[0]) {
                                                    setUserImage(res[0].url);
                                                    toast.success("Profile photo updated");
                                                }
                                            }}
                                            appearance={{
                                                button: { width: '100%', height: '100%' },
                                                container: { width: '100%', height: '100%' }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="space-y-1">
                                <h3 className="font-bold text-xl text-zinc-900 truncate px-4">{user.name || "Your Name"}</h3>
                                <p className="text-sm text-zinc-500 font-medium flex items-center justify-center gap-1">
                                    <AtSign className="h-3 w-3 opacity-50" />{user.username || "username"}
                                </p>
                            </div>

                            {/* Badges */}
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                                {expert?.gender && <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">{expert.gender}</span>}
                                {expert?.location && <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1"><MapPin className="h-3 w-3" /> {expert.location}</span>}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-6 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex gap-3 items-start">
                        <Sparkles className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-indigo-900">Pro Tip</p>
                            <p className="text-xs text-zinc-600 leading-relaxed">Profiles with social links and a clear photo get booked <strong>3x more often</strong>.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RIGHT: EDIT FORM --- */}
            <div className="lg:col-span-8 space-y-6">

                {/* 1. Personal Details */}
                <Card className={cn("border-zinc-200 shadow-sm transition-all", (errors.name || errors.username || errors.location) && "border-red-500 ring-1 ring-red-100")}>
                    <CardHeader className="border-b border-zinc-100 bg-zinc-50/30 pb-6">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center"><User className="h-4 w-4 text-indigo-600" /></div>
                            <div><CardTitle className="text-lg">Personal Details</CardTitle><CardDescription>This information will be displayed on your public profile.</CardDescription></div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 space-y-8">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name Input */}
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className={cn("text-xs font-semibold uppercase tracking-wider", errors.name ? "text-red-600" : "text-zinc-500")}>Full Name</Label>
                                    {errors.name && <span className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.name[0]}</span>}
                                </div>
                                <Input
                                    value={user.name || ""}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className={cn("h-11 bg-white", errors.name && "border-red-300 focus-visible:ring-red-200")}
                                    placeholder="e.g. Dr. Jane Doe"
                                />
                            </div>

                            {/* Username Input */}
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className={cn("text-xs font-semibold uppercase tracking-wider", errors.username ? "text-red-600" : "text-zinc-500")}>Username</Label>
                                    {errors.username && <span className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.username[0]}</span>}
                                </div>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3 text-zinc-400"><AtSign className="h-4 w-4" /></span>
                                    <Input
                                        value={user.username || ""}
                                        onChange={(e) => setUserUsername(e.target.value)}
                                        className={cn("pl-9 pr-12 h-11 bg-white", errors.username && "border-red-300 focus-visible:ring-red-200")}
                                        placeholder="janedoe"
                                    />
                                    <Button type="button" size="icon" variant="ghost" onClick={generateUsername} className="absolute right-1 h-9 w-9 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Auto-generate"><Wand2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email Address</Label>
                                <div className="relative"><Mail className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" /><Input value={user.email || ""} disabled className="pl-9 h-11 bg-zinc-50 text-zinc-500 cursor-not-allowed" /></div>
                            </div>

                            {/* Location Input */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Location</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                                    <Input
                                        value={expert?.location || ""}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="City, Country"
                                        className="pl-9 h-11 bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Gender</Label>
                                <Select value={expert?.gender || ""} onValueChange={setGender}>
                                    <SelectTrigger className="h-11 bg-white"><SelectValue placeholder="Select gender..." /></SelectTrigger>
                                    <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Non-Binary">Non-Binary</SelectItem><SelectItem value="Prefer not to say">Prefer not to say</SelectItem></SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Social Links */}
                <Card className="border-zinc-200 shadow-sm">
                    <CardHeader className="border-b border-zinc-100 bg-zinc-50/30 pb-6">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center"><Globe className="h-4 w-4 text-blue-600" /></div>
                            <div><CardTitle className="text-lg">Online Presence</CardTitle><CardDescription>Add links to your professional social profiles.</CardDescription></div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">LinkedIn URL</Label>
                                <div className="relative">
                                    <Linkedin className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                                    <Input value={socialLinks?.linkedin || ""} onChange={(e) => updateSocial("linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." className="pl-9 h-11 bg-white" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Twitter / X URL</Label>
                                <div className="relative">
                                    <Twitter className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                                    <Input value={socialLinks?.twitter || ""} onChange={(e) => updateSocial("twitter", e.target.value)} placeholder="https://twitter.com/..." className="pl-9 h-11 bg-white" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Personal Website</Label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                                    <Input value={socialLinks?.website || ""} onChange={(e) => updateSocial("website", e.target.value)} placeholder="https://yourwebsite.com" className="pl-9 h-11 bg-white" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}