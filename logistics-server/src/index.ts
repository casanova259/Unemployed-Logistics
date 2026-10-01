import express, { Request, Response } from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const PORT = parseInt(process.env.PORT || "8000", 10);
const NEXT_BASE_URL = process.env.NEXT_BASE_URL || "http://localhost:3000";
const SOCKET_EMIT_SECRET = process.env.SOCKET_EMIT_SECRET || "logistics-secret-socket-emit-token-2026";

const app = express();
const server = http.createServer(app);

// CORS configuration limited to Next.js client
app.use(
  cors({
    origin: [NEXT_BASE_URL, "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

// In-memory identity map: userId -> socket.id (and socket.id -> userId for fast cleanup)
const userSockets = new Map<string, string>();
const socketUsers = new Map<string, string>();

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: [NEXT_BASE_URL, "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket: Socket) => {
  console.log(`[Socket.IO] New connection established: ${socket.id}`);

  // Handle identity handshake
  socket.on("identity", ({ userId }: { userId: string }) => {
    if (!userId) return;
    userSockets.set(userId, socket.id);
    socketUsers.set(socket.id, userId);
    console.log(`[Socket.IO] Registered identity: User ${userId} -> Socket ${socket.id}`);
  });

  // Client joining a shipment room
  socket.on("join:shipment", ({ shipmentId }: { shipmentId: string }) => {
    if (shipmentId) {
      socket.join(`shipment:${shipmentId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined shipment:${shipmentId}`);
    }
  });

  socket.on("leave:shipment", ({ shipmentId }: { shipmentId: string }) => {
    if (shipmentId) {
      socket.leave(`shipment:${shipmentId}`);
      console.log(`[Socket.IO] Socket ${socket.id} left shipment:${shipmentId}`);
    }
  });

  socket.on("disconnect", () => {
    const userId = socketUsers.get(socket.id);
    if (userId) {
      userSockets.delete(userId);
      socketUsers.delete(socket.id);
      console.log(`[Socket.IO] Disconnected user ${userId} (socket ${socket.id})`);
    } else {
      console.log(`[Socket.IO] Disconnected anonymous socket ${socket.id}`);
    }
  });
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "logistics-server",
    connectedSockets: io.engine.clientsCount,
    activeIdentities: userSockets.size,
  });
});

/**
 * Protected emit endpoint
 * Requires x-socket-emit-secret header matching SOCKET_EMIT_SECRET
 */
app.post("/emit", (req: Request, res: Response) => {
  const secretHeader = req.headers["x-socket-emit-secret"];

  if (!secretHeader || secretHeader !== SOCKET_EMIT_SECRET) {
    console.warn(`[Socket Emit] Unauthorized emit attempt. Invalid or missing secret.`);
    res.status(401).json({ error: "Unauthorized: Invalid socket emit secret" });
    return;
  }

  const { event, data, recipientUserId, room } = req.body;

  if (!event) {
    res.status(400).json({ error: "Missing required 'event' field" });
    return;
  }

  console.log(`[Socket Emit] Emitting event '${event}'`, {
    room: room || "none",
    recipientUserId: recipientUserId || "none",
  });

  if (recipientUserId && userSockets.has(recipientUserId)) {
    const targetSocketId = userSockets.get(recipientUserId)!;
    io.to(targetSocketId).emit(event, data);
  }

  if (room) {
    io.to(room).emit(event, data);
  }

  // Also broadcast event to global listeners (e.g. staff dashboard)
  io.emit(event, data);

  res.json({ success: true, deliveredTo: { room, recipientUserId } });
});

server.listen(PORT, () => {
  console.log(`🚀 Logistics Realtime Server listening on port ${PORT}`);
  console.log(`👉 Client origin allowed: ${NEXT_BASE_URL}`);
});
