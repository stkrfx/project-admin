/*
 * File: src/app/(platform)/(standalone)/meet/[id]/page.js
 * ROLE: Expert Video Client
 * FEATURES: WebRTC, Whiteboard, Responsive Layout, Connects to User Socket
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import io from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Loader2, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Components
import Whiteboard from "@/components/video/Whiteboard";
import VideoControls from "@/components/video/VideoControls";

const VIDEO_STATE = {
  PENDING: "PENDING",
  CONNECTING: "CONNECTING",
  ACTIVE: "ACTIVE",
  DISCONNECTED: "DISCONNECTED"
};

export default function MeetPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id;

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const whiteboardRef = useRef(null);
  
  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const iceQueueRef = useRef([]);
  const localStreamRef = useRef(null);

  const [callState, setCallState] = useState(VIDEO_STATE.PENDING);
  const [remoteUserConnected, setRemoteUserConnected] = useState(false);

  // --- SOCKET & WEBRTC SETUP ---
  useEffect(() => {
    
    if (!appointmentId || socketRef.current) return;

    setCallState(VIDEO_STATE.CONNECTING);

    const init = async () => {
      try {
         // ⚠️ CONNECT TO USER APP'S SOCKET
         const SOCKET_URL = process.env.NEXT_PUBLIC_USER_APP_URL || "http://localhost:3000"; 
         
         const newSocket = io(SOCKET_URL, { 
             path: "/api/socket_io",
             transports: ["websocket", "polling"],
             withCredentials: true
         });
         socketRef.current = newSocket;

         newSocket.on("connect", () => {
             console.log("✅ Connected to video room:", appointmentId);
             newSocket.emit("join-video", appointmentId);
         });

         // 1. Get Media
         const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
         localStreamRef.current = stream;
         if (localVideoRef.current) {
             localVideoRef.current.srcObject = stream;
             localVideoRef.current.muted = true; // Avoid echo
         }

         // 2. Peer Setup
         const peer = new RTCPeerConnection({
             iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
         });
         peerRef.current = peer;
         stream.getTracks().forEach(track => peer.addTrack(track, stream));

         peer.ontrack = (event) => {
             const [remoteStream] = event.streams;
             if (remoteVideoRef.current) {
                 remoteVideoRef.current.srcObject = remoteStream;
                 setRemoteUserConnected(true);
                 setCallState(VIDEO_STATE.ACTIVE);
                 remoteVideoRef.current.play().catch(() => {});
             }
         };

         peer.onicecandidate = (event) => {
             if (event.candidate) {
                 newSocket.emit("ice-candidate", { candidate: event.candidate, roomId: appointmentId });
             }
         };

         // 3. Signaling
         newSocket.emit("client-ready", appointmentId);

         newSocket.on("user-connected", async () => {
             console.log("Client connected, creating offer...");
             const offer = await peer.createOffer();
             await peer.setLocalDescription(offer);
             newSocket.emit("offer", { offer, roomId: appointmentId });
         });

         newSocket.on("offer", async ({ offer }) => {
             await peer.setRemoteDescription(new RTCSessionDescription(offer));
             const answer = await peer.createAnswer();
             await peer.setLocalDescription(answer);
             newSocket.emit("answer", { answer, roomId: appointmentId });
             processIceQueue();
         });

         newSocket.on("answer", async ({ answer }) => {
             await peer.setRemoteDescription(new RTCSessionDescription(answer));
             processIceQueue();
         });

         newSocket.on("ice-candidate", async ({ candidate }) => {
             if (peer.remoteDescription) {
                 await peer.addIceCandidate(new RTCIceCandidate(candidate));
             } else {
                 iceQueueRef.current.push(candidate);
             }
         });

         // 4. Whiteboard Sync (Send State on Request)
         newSocket.on("wb-request-state", ({ requesterId }) => {
             if (whiteboardRef.current) {
                 const image = whiteboardRef.current.toDataURL();
                 newSocket.emit("wb-send-state", { roomId: appointmentId, image, requesterId });
             }
         });

         // Receive Sync (Rare, but good if expert refreshes)
         newSocket.on("wb-update-state", ({ image }) => {
             const img = new Image();
             img.onload = () => whiteboardRef.current?.getContext("2d").drawImage(img, 0, 0);
             img.src = image;
         });

         newSocket.on("disconnect", () => {
             toast.info("Client disconnected");
             setRemoteUserConnected(false);
         });

      } catch (err) {
          console.error("Init Failed:", err);
          setCallState(VIDEO_STATE.DISCONNECTED);
          toast.error("Media Error", { description: "Failed to access camera/mic." });
      }
    };

    const processIceQueue = async () => {
        if (!peerRef.current) return;
        while (iceQueueRef.current.length > 0) {
            const candidate = iceQueueRef.current.shift();
            try { await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
        }
    };

    init();

    return () => {
        if (socketRef.current) socketRef.current.disconnect();
        if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
        if (peerRef.current) peerRef.current.close();
    };
  }, [appointmentId]);

  const handleEndCall = () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      router.push("/appointments");
  };

  if (!appointmentId) return <div className="p-10 text-center bg-zinc-950 text-white">Invalid Room</div>;

  if (callState === VIDEO_STATE.PENDING || callState === VIDEO_STATE.CONNECTING) {
      return (
          <div className="flex h-[calc(100dvh-4rem)] items-center justify-center bg-zinc-950 flex-col">
              <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
              <p className="text-zinc-400">Securely connecting to session…</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100dvh-4rem)] bg-zinc-950 overflow-hidden">
      
      {/* 1. WHITEBOARD (Main Area)
          Mobile: Bottom half
          Desktop: Left side
      */}
      <div className="flex-1 relative bg-white order-2 lg:order-1 overflow-hidden p-4">
        <Whiteboard 
            socket={socketRef.current} 
            roomId={appointmentId} 
            canvasRef={whiteboardRef}
        />
        
        {/* Controls Overlay */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
            <VideoControls 
                localStream={localStreamRef.current}
                onEndCall={handleEndCall}
            />
        </div>
      </div>

      {/* 2. VIDEO SIDEBAR
          Mobile: Top half
          Desktop: Right side (fixed width)
      */}
      <div className="w-full lg:w-96 bg-zinc-900 flex flex-row lg:flex-col border-b lg:border-b-0 lg:border-l border-zinc-800 order-1 lg:order-2 shrink-0 z-10 shadow-2xl">
        
        {/* Remote Video (Client) */}
        <div className="flex-1 lg:h-1/2 relative bg-zinc-950 border-r lg:border-r-0 lg:border-b border-zinc-800 overflow-hidden group">
           <video 
             ref={remoteVideoRef} 
             autoPlay 
             playsInline 
             className="w-full h-full object-cover bg-black" 
           />
           {!remoteUserConnected && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center">
                    <Loader2 className="h-6 w-6 text-zinc-500 animate-spin mx-auto mb-2" />
                    <p className="text-zinc-400 text-xs">Waiting for client...</p>
                </div>
             </div>
           )}
           <span className="absolute top-2 left-2 text-white text-[10px] font-bold bg-indigo-600/80 px-2 py-0.5 rounded backdrop-blur-sm">CLIENT</span>
        </div>

        {/* Local Video (Expert) */}
        <div className="flex-1 lg:h-1/2 relative bg-zinc-900 overflow-hidden group">
           <video 
             ref={localVideoRef} 
             autoPlay 
             playsInline 
             muted 
             className="w-full h-full object-cover bg-zinc-800" 
           />
           <span className="absolute top-2 left-2 text-white text-[10px] font-bold bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">YOU (EXPERT)</span>
        </div>

      </div>
    </div>
  );
}