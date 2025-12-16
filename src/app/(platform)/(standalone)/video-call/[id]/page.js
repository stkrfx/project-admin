/*
 * File: src/app/(platform)/(standalone)/video-call/[id]/page.js
 * ROLE: Expert Video Client (Unified UI)
 * FEATURES:
 * - Matches Mindnamo UI exactly (Sidebar controls)
 * - Interactive Whiteboard (Expert can draw)
 * - Connects to User App Socket
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import io from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Expert gets the interactive board
import Whiteboard from "@/components/video/Whiteboard";

export default function ExpertVideoCallPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id;

  // ---------------- REFS ----------------
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const whiteboardRef = useRef(null); // passed to Whiteboard component

  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const iceQueueRef = useRef([]);
  const localStreamRef = useRef(null);

  // ---------------- STATE ----------------
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [remoteUserConnected, setRemoteUserConnected] = useState(false);

  // ---------------- INIT ----------------
  useEffect(() => {
    if (!meetingId) return;
    if (socketRef.current) return;

    const processIceQueue = async () => {
      if (!peerRef.current) return;
      while (iceQueueRef.current.length) {
        const candidate = iceQueueRef.current.shift();
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {}
      }
    };

    const init = async () => {
      try {
        setConnectionStatus("Initializing...");

        // 1. Connect to USER APP Socket Server (Cross-Origin)
        const SOCKET_URL =
          process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3000";

        const socket = io(SOCKET_URL, {
          path: "/api/socket_io",
          transports: ["websocket", "polling"],
          withCredentials: true,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          console.log("✅ Expert connected to room:", meetingId);
          socket.emit("join-video", meetingId);
        });

        // 2. Media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true; // Mute local self-view
        }

        // 3. Peer
        const peer = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        peerRef.current = peer;

        stream.getTracks().forEach((t) => peer.addTrack(t, stream));

        peer.ontrack = (e) => {
          const [remoteStream] = e.streams;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(() => {});
            setRemoteUserConnected(true);
            setConnectionStatus("Connected");
          }
        };

        peer.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("ice-candidate", {
              candidate: e.candidate,
              roomId: meetingId,
            });
          }
        };

        // 4. Signaling
        socket.emit("client-ready", meetingId);

        socket.on("user-connected", async () => {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit("offer", { offer, roomId: meetingId });
        });

        socket.on("offer", async ({ offer }) => {
          await peer.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit("answer", { answer, roomId: meetingId });
          processIceQueue();
        });

        socket.on("answer", async ({ answer }) => {
          await peer.setRemoteDescription(new RTCSessionDescription(answer));
          processIceQueue();
        });

        socket.on("ice-candidate", async ({ candidate }) => {
          if (peer.remoteDescription) {
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            iceQueueRef.current.push(candidate);
          }
        });

        // 5. Whiteboard Sync Helpers (State Exchange)
        // Expert primarily DRAWS, but if a client joins late, we might need to send state
        socket.on("wb-request-state", ({ requesterId }) => {
          if (!whiteboardRef.current) return;
          // Depending on how Whiteboard.js is implemented, we might need to access the canvas directly
          // For the project-admin `Whiteboard.js`, it uses a ref we passed.
          // We can try to grab data URL if the component exposes the canvas element
          const canvasEl = whiteboardRef.current; 
          if(canvasEl) {
             const image = canvasEl.toDataURL();
             socket.emit("wb-send-state", { roomId: meetingId, image, requesterId });
          }
        });

        socket.on("disconnect", () => {
             setRemoteUserConnected(false);
             setConnectionStatus("Reconnecting...");
        });

      } catch (err) {
        console.error(err);
        setConnectionStatus("Error");
        toast.error("Could not access camera/microphone");
      }
    };

    init();

    return () => {
      socketRef.current?.disconnect();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerRef.current?.close();
    };
  }, [meetingId]);

  // ---------------- CONTROLS ----------------
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsVideoOff(!track.enabled);
  };

  const handleEndCall = () => {
      socketRef.current?.disconnect();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerRef.current?.close();
      router.push("/appointments");
  };

  // ---------------- UI ----------------
  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] bg-zinc-950 overflow-hidden">
      
      {/* WHITEBOARD AREA */}
      <div className="flex-1 relative bg-white order-2 lg:order-1 flex flex-col">
        {/* We use the interactive component here for the Expert */}
        <div className="flex-1 relative">
            <Whiteboard 
                socket={socketRef.current} 
                roomId={meetingId} 
                canvasRef={whiteboardRef} 
            />
        </div>
        <div className="absolute top-4 left-4 bg-zinc-900/80 text-white px-3 py-1 rounded-full text-xs pointer-events-none">
          Live Whiteboard (Expert Mode)
        </div>
      </div>

      {/* VIDEO SIDEBAR */}
      <div className="w-full lg:w-96 bg-zinc-900 flex flex-col border-l border-zinc-800 order-1 lg:order-2">
        
        {/* REMOTE VIDEO (The Client) */}
        <div className="flex-1 relative bg-black min-h-[200px]">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!remoteUserConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 flex-col gap-2">
              <Loader2 className="animate-spin text-zinc-400" />
              <span className="text-zinc-500 text-xs">Waiting for client...</span>
            </div>
          )}
          <span className="absolute top-2 left-2 text-xs bg-indigo-600/80 px-2 py-0.5 rounded text-white">
            CLIENT
          </span>
        </div>

        {/* LOCAL VIDEO (The Expert) */}
        <div className="flex-1 relative bg-zinc-800 min-h-[200px]">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "w-full h-full object-cover",
              isVideoOff && "opacity-0"
            )}
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center">
              <VideoOff className="text-zinc-400" />
            </div>
          )}
          <span className="absolute top-2 left-2 text-xs bg-black/50 px-2 py-0.5 rounded text-white">
            YOU
          </span>
        </div>

        {/* UNIFIED CONTROLS (Matching Mindnamo Style) */}
        <div className="p-4 flex justify-center gap-3 border-t border-zinc-800 bg-zinc-900">
          <Button size="icon" variant={isMuted ? "destructive" : "secondary"} onClick={toggleMute}>
            {isMuted ? <MicOff /> : <Mic />}
          </Button>

          <Button size="icon" variant={isVideoOff ? "destructive" : "secondary"} onClick={toggleVideo}>
            {isVideoOff ? <VideoOff /> : <Video />}
          </Button>

          <Button variant="destructive" onClick={handleEndCall}>
            <PhoneOff className="mr-2 h-4 w-4" /> End
          </Button>
        </div>
      </div>
    </div>
  );
}