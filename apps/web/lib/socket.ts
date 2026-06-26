import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket) {
    socket.disconnect();
  }

  const url = process.env.NEXT_PUBLIC_REALTIME_URL || "http://localhost:4000";
  
  socket = io(url, {
    auth: {
      token,
    },
    transports: ["websocket"],
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
