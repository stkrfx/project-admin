/*
 * File: src/components/video/VideoControls.js
 * ROLE: Modular Video Controls
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VideoControls({ localStream, onEndCall, className }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <div className={cn("flex items-center gap-4 bg-zinc-900/90 backdrop-blur px-6 py-3 rounded-full shadow-xl border border-white/10", className)}>
      <Button
        size="icon"
        variant={isMuted ? "destructive" : "secondary"}
        className="rounded-full h-12 w-12 transition-all"
        onClick={toggleMute}
      >
        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </Button>

      <Button
        size="icon"
        variant={isVideoOff ? "destructive" : "secondary"}
        className="rounded-full h-12 w-12 transition-all"
        onClick={toggleVideo}
      >
        {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
      </Button>

      <div className="w-px h-8 bg-white/20 mx-1" />

      <Button
        variant="destructive"
        className="rounded-full px-6 h-12 bg-red-600 hover:bg-red-700 text-white font-medium"
        onClick={onEndCall}
      >
        <PhoneOff className="h-5 w-5 mr-2" /> End
      </Button>
    </div>
  );
}