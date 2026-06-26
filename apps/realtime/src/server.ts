import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { handleLobbyConnection, SocketUserPayload } from "./lobby.js";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000" }));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const JWT_SECRET = process.env.ROOM_JWT_SECRET || "fallback-secret-for-development-only-replace-in-env";

// Middleware to authenticate socket connections
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;

  if (!token) {
    return next(new Error("Authentication error: Token is required"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SocketUserPayload;
    if (!decoded.roomId || !decoded.participantId || !decoded.role) {
      return next(new Error("Authentication error: Invalid token claims"));
    }
    
    // Attach user payload to socket
    (socket as any).user = decoded;
    next();
  } catch (err) {
    console.error("Socket authentication error:", err);
    return next(new Error("Authentication error: Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  const user = (socket as any).user as SocketUserPayload;
  console.log(`User connected: ${user.participantId} in room ${user.roomId} (Role: ${user.role})`);

  // Handle lobby joining and presence
  handleLobbyConnection(socket, user);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Realtime Socket.io server running on port ${PORT}`);
});
