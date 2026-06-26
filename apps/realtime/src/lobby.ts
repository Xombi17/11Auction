import { Socket } from "socket.io";
import { prisma } from "@bidstand/db";

export interface SocketUserPayload {
  roomId: string;
  participantId: string;
  role: "COMMISSIONER" | "TEAM_OWNER" | "SPECTATOR";
  teamId?: string | null;
}

export async function handleLobbyConnection(socket: Socket, payload: SocketUserPayload) {
  const { roomId, participantId } = payload;

  try {
    // 1. Join Socket.io room
    socket.join(roomId);

    // 2. Update participant state to connected
    await prisma.participant.update({
      where: { id: participantId },
      data: {
        connected: true,
        lastSeenAt: new Date(),
      },
    });

    // 3. Broadcast the updated lobby snapshot
    await broadcastLobbyState(socket.nsp.server, roomId);

    // 4. Handle disconnect
    socket.on("disconnect", async () => {
      try {
        await prisma.participant.update({
          where: { id: participantId },
          data: {
            connected: false,
            lastSeenAt: new Date(),
          },
        });
        await broadcastLobbyState(socket.nsp.server, roomId);
      } catch (err) {
        console.error("Error updating connection status on disconnect:", err);
      }
    });
  } catch (error) {
    console.error("Error in handleLobbyConnection:", error);
    socket.emit("error", { message: "Failed to initialize lobby session" });
  }
}

export async function broadcastLobbyState(io: any, roomId: string) {
  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        teams: {
          include: {
            ownerParticipant: true,
          },
        },
        participants: true,
      },
    });

    if (!room) return;

    const payload = {
      ok: true,
      room: {
        id: room.id,
        code: room.code,
        name: room.name,
        status: room.status,
        defaultPurse: room.defaultPurse,
        squadSizeCap: room.squadSizeCap,
        roleCaps: room.roleCaps,
        timerSeconds: room.timerSeconds,
        incrementRule: room.incrementRule,
      },
      teams: room.teams.map((t) => ({
        id: t.id,
        name: t.name,
        purseTotal: t.purseTotal,
        purseRemaining: t.purseRemaining,
        ownerParticipantId: t.ownerParticipantId,
        ownerParticipantName: t.ownerParticipant?.displayName || null,
      })),
      participants: room.participants.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        role: p.role,
        connected: p.connected,
        lastSeenAt: p.lastSeenAt,
      })),
    };

    io.to(roomId).emit("room:state", payload);
  } catch (error) {
    console.error("Error broadcasting lobby state:", error);
  }
}
