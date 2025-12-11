"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing"; // Use the hook, not the button component

export function IdentitySection({ user }) {
  const [image, setImage] = useState(user.image);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Custom Upload Hook
  const { startUpload } = useUploadThing("profilePicture", {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        setImage(res[0].url);
        // Update hidden input for form submission
        const input = document.getElementById("hidden-image");
        if (input) input.value = res[0].url;
        toast.success("Profile picture updated!");
      }
      setIsUploading(false);
    },
    onUploadError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      setIsUploading(false);
    },
  });

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    await startUpload([file]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Left: Interactive Avatar */}
      <Card className="lg:col-span-1 border-zinc-200 shadow-sm h-fit overflow-hidden">
        <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Profile Photo</CardTitle>
            <CardDescription>Click the image to change your avatar.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center pb-8">
            <div 
                onClick={handleImageClick}
                className="group relative h-40 w-40 rounded-full cursor-pointer overflow-hidden border-4 border-white shadow-xl transition-all hover:shadow-2xl active:scale-95"
            >
                {/* 1. The Image */}
                <Avatar className="h-full w-full">
                    <AvatarImage src={image} className="object-cover" />
                    <AvatarFallback className="text-5xl font-bold bg-zinc-100 text-zinc-300">
                        {user.name?.[0] || "U"}
                    </AvatarFallback>
                </Avatar>

                {/* 2. The Overlay (Hover State) */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                    <Camera className="h-8 w-8 mb-1" />
                    <span className="text-xs font-medium">Change Photo</span>
                </div>

                {/* 3. Loading State */}
                {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                        <Loader2 className="h-10 w-10 text-white animate-spin" />
                    </div>
                )}
            </div>

            {/* Hidden Input */}
            <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
            />
            <input type="hidden" name="image" id="hidden-image" defaultValue={image} />
        </CardContent>
      </Card>

      {/* Right: Info Fields */}
      <Card className="lg:col-span-2 border-zinc-200 shadow-sm">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-4 w-4 text-zinc-500"/> Personal Details</CardTitle>
            <CardDescription>This information is public. Make sure it represents you well.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-zinc-700">Full Name</Label>
                    <Input 
                        name="name" 
                        defaultValue={user.name} 
                        placeholder="e.g. Dr. Sarah Connor" 
                        className="bg-zinc-50/50 focus:bg-white transition-colors"
                        required 
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="username" className="text-zinc-700">Username</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-zinc-400 font-medium select-none">@</span>
                        <Input 
                            name="username" 
                            defaultValue={user.username} 
                            placeholder="sarahconnor" 
                            className="pl-7 bg-zinc-50/50 focus:bg-white transition-colors"
                        />
                    </div>
                    <p className="text-[10px] text-zinc-500">
                        mindnamo.com/expert/<strong>{user.username || "username"}</strong>
                    </p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}