/*
 * File: src/app/(platform)/(standalone)/meet/[id]/page.js
 * ROLE: Expert Video Client
 * FEATURES:
 * - WebRTC (Audio + Video)
 * - Whiteboard sync
 * - Responsive layout (mobile + desktop)
 * - Connects to USER APP Socket.IO server
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import io from "socket.io-client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// Components
import Whiteboard from "@/components/video/Whiteboard";
import VideoControls from "@/components/video/VideoControls";

/* ----------------------------------------------------
 * VIDEO STATE
 * -------------------------------------------------- */
const VIDEO_STATE = {
  PENDING: "PENDING",
  CONNECTING: "CONNECTING",
  ACTIVE: "ACTIVE",
  DISCONNECTED: "DISCONNECTED",
};

export default function MeetPage() {
  const params = useParams();
  const router = useRouter();

  // NOTE: params.id is a secure meetingId (NOT appointmentId)
  const meetingId = params.id;

  /* ----------------------------------------------------
   * REFS
   * -------------------------------------------------- */
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const whiteboardRef = useRef(null);

  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const iceQueueRef = useRef([]);
  const localStreamRef = useRef(null);

  /* ----------------------------------------------------
   * STATE
   * -------------------------------------------------- */
  const [callState, setCallState] = useState(VIDEO_STATE.PENDING);
  const [remoteUserConnected, setRemoteUserConnected] = useState(false);

  /* ----------------------------------------------------
   * SOCKET + WEBRTC INITIALIZATION
   * -------------------------------------------------- */
  useEffect(() => {
    if (!meetingId || socketRef.current) return;

    setCallState(VIDEO_STATE.CONNECTING);

    const processIceQueue = async () => {
      if (!peerRef.current) return;

      while (iceQueueRef.current.length > 0) {
        const candidate = iceQueueRef.current.shift();
        try {
          await peerRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch {
          // ignore
        }
      }
    };

    const init = async () => {
      try {
        /* -------------------------------
         * 1. CONNECT TO USER SOCKET
         * ----------------------------- */
        const SOCKET_URL =
          process.env.NEXT_PUBLIC_USER_APP_URL || "http://localhost:3000";

        const socket = io(SOCKET_URL, {
          path: "/api/socket_io",
          transports: ["websocket", "polling"],
          withCredentials: true,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          console.log("✅ Expert connected to meeting:", meetingId);
          socket.emit("join-video", meetingId);
        });

        /* -------------------------------
         * 2. GET USER MEDIA
         * ----------------------------- */
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
        }

        /* -------------------------------
         * 3. PEER CONNECTION
         * ----------------------------- */
        const peer = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        peerRef.current = peer;

        stream.getTracks().forEach((track) =>
          peer.addTrack(track, stream)
        );

        peer.ontrack = (event) => {
          const [remoteStream] = event.streams;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(() => {});
            setRemoteUserConnected(true);
            setCallState(VIDEO_STATE.ACTIVE);
          }
        };

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", {
              candidate: event.candidate,
              roomId: meetingId,
            });
          }
        };

        /* -------------------------------
         * 4. SIGNALING
         * ----------------------------- */
        socket.emit("client-ready", meetingId);

        socket.on("user-connected", async () => {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit("offer", { offer, roomId: meetingId });
        });

        socket.on("offer", async ({ offer }) => {
          await peer.setRemoteDescription(
            new RTCSessionDescription(offer)
          );
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit("answer", { answer, roomId: meetingId });
          processIceQueue();
        });

        socket.on("answer", async ({ answer }) => {
          await peer.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          processIceQueue();
        });

        socket.on("ice-candidate", async ({ candidate }) => {
          if (peer.remoteDescription) {
            await peer.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          } else {
            iceQueueRef.current.push(candidate);
          }
        });

        /* -------------------------------
         * 5. WHITEBOARD SYNC
         * ----------------------------- */
        socket.on("wb-request-state", ({ requesterId }) => {
          if (!whiteboardRef.current) return;
          const image = whiteboardRef.current.toDataURL();
          socket.emit("wb-send-state", {
            roomId: meetingId,
            image,
            requesterId,
          });
        });

        socket.on("wb-update-state", ({ image }) => {
          if (!whiteboardRef.current) return;
          const img = new Image();
          img.onload = () => {
            whiteboardRef.current
              .getContext("2d")
              .drawImage(img, 0, 0);
          };
          img.src = image;
        });

        socket.on("disconnect", () => {
          setRemoteUserConnected(false);
          toast.info("Client disconnected");
        });
      } catch (err) {
        console.error("Video init failed:", err);
        setCallState(VIDEO_STATE.DISCONNECTED);
        toast.error("Failed to access camera or microphone");
      }
    };

    init();

    return () => {
      socketRef.current?.disconnect();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerRef.current?.close();
    };
  }, [meetingId]);

  /* ----------------------------------------------------
   * END CALL
   * -------------------------------------------------- */
  const handleEndCall = () => {
    socketRef.current?.disconnect();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current?.close();
    router.push("/appointments");
  };

  /* ----------------------------------------------------
   * RENDER STATES
   * -------------------------------------------------- */
  if (!meetingId) {
    return (
      <div className="p-10 text-center bg-zinc-950 text-white">
        Invalid Room
      </div>
    );
  }

  if (
    callState === VIDEO_STATE.PENDING ||
    callState === VIDEO_STATE.CONNECTING
  ) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center bg-zinc-950 flex-col">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-zinc-400">
          Securely connecting to session…
        </p>
      </div>
    );
  }

  /* ----------------------------------------------------
   * MAIN UI
   * -------------------------------------------------- */
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100dvh-4rem)] bg-zinc-950 overflow-hidden">
      {/* WHITEBOARD */}
      <div className="flex-1 relative bg-white order-2 lg:order-1 p-4">
        <Whiteboard
          socket={socketRef.current}
          roomId={meetingId}
          canvasRef={whiteboardRef}
        />

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
          <VideoControls
            localStream={localStreamRef.current}
            onEndCall={handleEndCall}
          />
        </div>
      </div>

      {/* VIDEO SIDEBAR */}
      <div className="w-full lg:w-96 bg-zinc-900 flex flex-row lg:flex-col border-l border-zinc-800 order-1 lg:order-2">
        {/* REMOTE */}
        <div className="flex-1 relative bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!remoteUserConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
            </div>
          )}
          <span className="absolute top-2 left-2 text-xs bg-indigo-600/80 px-2 py-0.5 rounded text-white">
            CLIENT
          </span>
        </div>

        {/* LOCAL */}
        <div className="flex-1 relative bg-zinc-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <span className="absolute top-2 left-2 text-xs bg-black/50 px-2 py-0.5 rounded text-white">
            YOU (EXPERT)
          </span>
        </div>
      </div>
    </div>
  );
}
