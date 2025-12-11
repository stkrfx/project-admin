"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadButton } from "@/components/upload-button";
import { User, Wand2, AtSign, MapPin, Camera, Sparkles, Globe, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function IdentitySection({ user, setUserName, setUserUsername, setUserImage, expert, setGender, setLocation }) {
  const [isHovered, setIsHovered] = useState(false);

  const generateUsername = () => {
    if (!user.name) return toast.error("Please enter your name first.");
    
    const random = Math.floor(Math.random() * 1000);
    // Remove spaces, special chars, lowercase, add random number
    const slug = user.name.toLowerCase().replace(/[^a-z0-9]/g, '') + random;
    
    setUserUsername(slug);
    toast.success("New username generated!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- LEFT: LIVE PREVIEW CARD (4 Columns) --- */}
        <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-24">
                <Card className="overflow-hidden border-border shadow-sm">
                    {/* Decorative Banner */}
                    <div className="h-32 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border relative overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    </div>
                    
                    <CardContent className="px-6 pb-8 text-center relative">
                        {/* Avatar Upload with Hover Effect */}
                        <div 
                            className="relative -mt-16 mb-4 inline-block group"
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                        >
                            <Avatar className="h-32 w-32 border-[6px] border-background shadow-xl cursor-pointer transition-transform duration-300 group-hover:scale-105 bg-muted">
                                <AvatarImage src={user.image} className="object-cover" />
                                <AvatarFallback className="text-4xl font-bold text-muted-foreground bg-muted">
                                    {user.name?.[0]?.toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                            
                            {/* Upload Overlay */}
                            <div className={cn(
                                "absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full transition-opacity duration-200 border-[6px] border-transparent",
                                isHovered ? "opacity-100" : "opacity-0"
                            )}>
                                <Camera className="h-6 w-6 text-white mb-1" />
                                <span className="text-[10px] text-white font-bold uppercase tracking-wider">Change</span>
                                
                                {/* Invisible Upload Trigger */}
                                <div className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                                    <UploadButton 
                                        endpoint="imageUploader"
                                        onClientUploadComplete={(res) => {
                                            if(res?.[0]) {
                                                setUserImage(res[0].url);
                                                toast.success("Profile photo updated");
                                            }
                                        }}
                                        appearance={{ button: { width: '100%', height: '100%' }, container: { width: '100%', height: '100%' } }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* User Info Preview */}
                        <div className="space-y-1">
                            <h3 className="font-bold text-xl text-foreground truncate px-4">
                                {user.name || "Your Name"}
                            </h3>
                            <p className="text-sm text-muted-foreground font-medium flex items-center justify-center gap-1">
                                <AtSign className="h-3 w-3 opacity-50" />
                                {user.username || "username"}
                            </p>
                        </div>

                        {/* Meta Badges */}
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                            {expert?.gender && (
                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                                    {expert.gender}
                                </span>
                            )}
                            {expert?.location && (
                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {expert.location}
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Helper Tip */}
                <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-3 items-start">
                    <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-primary">Pro Tip</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Profiles with a clear face photo and verified identity details get booked <strong>3x more often</strong>.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* --- RIGHT: EDIT FORM (8 Columns) --- */}
        <div className="lg:col-span-8 space-y-6">
            <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border/50 bg-muted/20 pb-6">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Personal Details</CardTitle>
                            <CardDescription>This information will be displayed on your public profile.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="p-6 md:p-8 space-y-8">
                    
                    {/* Row 1: Name & Username */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</Label>
                            <Input 
                                value={user.name} 
                                onChange={(e) => setUserName(e.target.value)} 
                                className="h-11 bg-background"
                                placeholder="e.g. Dr. Jane Doe"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Username</Label>
                            <div className="relative flex items-center">
                                <span className="absolute left-3 text-muted-foreground">
                                    <AtSign className="h-4 w-4" />
                                </span>
                                <Input 
                                    value={user.username} 
                                    onChange={(e) => setUserUsername(e.target.value)} 
                                    className="pl-9 pr-12 h-11 bg-background"
                                    placeholder="janedoe"
                                />
                                <Button 
                                    type="button" 
                                    size="icon" 
                                    variant="ghost" 
                                    onClick={generateUsername}
                                    className="absolute right-1 h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                    title="Auto-generate unique username"
                                >
                                    <Wand2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Contact & Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    value={user.email} 
                                    disabled 
                                    className="pl-9 h-11 bg-muted/50 text-muted-foreground cursor-not-allowed" 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    value={expert?.location || ""}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="City, Country"
                                    className="pl-9 h-11 bg-background"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Gender & Timezone (Visual grouping) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gender</Label>
                            <Select value={expert?.gender} onValueChange={setGender}>
                                <SelectTrigger className="h-11 bg-background">
                                    <SelectValue placeholder="Select gender..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Non-Binary">Non-Binary</SelectItem>
                                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {/* Placeholder for future Timezone field if needed */}
                        <div className="space-y-2 opacity-50 pointer-events-none">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timezone</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                <Input value="Auto-detected (UTC+0)" disabled className="pl-9 h-11 bg-muted/50" />
                            </div>
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
    </div>
  );
}