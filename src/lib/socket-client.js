// src/lib/socket-client.js
import { io } from "socket.io-client";

let socket;

export const initSocket = (userId) => {
  if (socket && socket.connected) return socket;

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3002";

  socket = io(socketUrl, {
    path: "/api/socket_io",
    query: {
      userId,
      role: "expert",
    },
    transports: ["websocket", "polling"],
    withCredentials: true,
  });

  // ✅ CONNECTION LOGS MOVED HERE
  socket.on("connect", () => {
    console.log("✅ Socket connected successfully");
    console.log("🔌 Socket ID:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("🚨 Socket connection error:", error.message);
  });

  socket.on("reconnect_attempt", (attempt) => {
    console.log("🔄 Reconnecting... attempt:", attempt);
  });

  return socket;
};

export const getSocket = () => socket;