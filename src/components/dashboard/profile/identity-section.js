"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Camera, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";

export function IdentitySection({ user, setUserName, setUserUsername, setUserImage }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { startUpload } = useUploadThing("profilePicture", {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        setUserImage(res[0].url);
        toast.success("Photo updated!");
      }
      setIsUploading(false);
    },
    onUploadError: () => {
      toast.error("Upload failed");
      setIsUploading(false);
    },
  });

  const handleImageClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    await startUpload([file]);
  };

  const generateUsername = () => {
    if (!user.name) return toast.error("Enter your name first");
    const random = Math.floor(Math.random() * 999);
    const slug = user.name.toLowerCase().replace(/\s+/g, '') + random;
    setUserUsername(slug);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* 1. Interactive Avatar Card */}
      <Card className="lg:col-span-1 border-zinc-200 shadow-sm h-fit">
        <CardHeader>
            <CardTitle className="text-base">Public Avatar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pb-8">
            <div 
                onClick={handleImageClick}
                className="group relative h-40 w-40 rounded-full cursor-pointer overflow-hidden border-[6px] border-zinc-50 shadow-xl transition-all hover:scale-105 hover:border-indigo-50"
            >
                <Avatar className="h-full w-full">
                    <AvatarImage src={user.image} className="object-cover" />
                    <AvatarFallback className="text-5xl font-bold bg-zinc-900 text-white">
                        {user.name?.[0] || "U"}
                    </AvatarFallback>
                </Avatar>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-zinc-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                    <Camera className="h-8 w-8 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                </div>

                {/* Loading State */}
                {isUploading && (
                    <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                    </div>
                )}
            </div>
            
            <p className="text-xs text-zinc-400 text-center max-w-[150px]">
                Click the image to upload a professional photo.
            </p>
            
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </CardContent>
      </Card>

      {/* 2. Identity Inputs */}
      <Card className="lg:col-span-2 border-zinc-200 shadow-sm">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-4 w-4 text-zinc-500"/> Personal Details</CardTitle>
            <CardDescription>Your name and unique handle on the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Name Input */}
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                        name="name" 
                        value={user.name} 
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="e.g. Dr. Sarah Connor" 
                        className="bg-zinc-50/50 focus:bg-white"
                    />
                </div>

                {/* Smart Username Input */}
                <div className="space-y-2">
                    <Label htmlFor="username" className="flex justify-between">
                        Username
                        <span 
                            onClick={generateUsername} 
                            className="text-xs text-indigo-600 cursor-pointer hover:underline flex items-center gap-1"
                        >
                            <Sparkles className="h-3 w-3" /> Auto-generate
                        </span>
                    </Label>
                    <div className="relative group">
                        <span className="absolute left-3 top-2.5 text-zinc-400 font-medium select-none group-focus-within:text-indigo-500">@</span>
                        <Input 
                            name="username" 
                            value={user.username}
                            onChange={(e) => setUserUsername(e.target.value)}
                            placeholder="sarahconnor" 
                            className="pl-7 bg-zinc-50/50 focus:bg-white font-medium"
                        />
                    </div>
                    <p className="text-[10px] text-zinc-500">
                        Profile URL: mindnamo.com/expert/<span className="font-mono text-zinc-700">{user.username || "username"}</span>
                    </p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}