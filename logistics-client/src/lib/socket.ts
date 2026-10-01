"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(userId: string): Socket {
  const url = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:8000";

  if (!socket) {
    socket = io(url, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected to realtime server with id:", socket?.id);
      if (userId) {
        socket?.emit("identity", { userId });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.warn("[Socket] Realtime connection issue:", error.message);
    });
  } else if (!socket.connected) {
    socket.connect();
  } else if (userId) {
    socket.emit("identity", { userId });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
