import { Socket, Server } from "socket.io";
import { prisma } from "@bidstand/db";
import { startTimer, clearTimer } from "./timer.js";
import {
  bidPlaceSchema,
  roomActionSchema,
  forceResolveSchema,
  kickParticipantSchema
} from "@bidstand/shared";
import { broadcastLobbyState } from "../lobby.js";

// In-memory map to store remaining seconds for paused rooms
const pausedTimeRemaining = new Map<string, number>();

export interface SocketUserPayload {
  roomId: string;
  participantId: string;
  role: "COMMISSIONER" | "TEAM_OWNER" | "SPECTATOR";
  teamId?: string | null;
}

export function getIncrementForPrice(price: number, incrementRule: any): number {
  let rules: { threshold: number; increment: number }[] = [];
  
  if (typeof incrementRule === "string") {
    try {
      rules = JSON.parse(incrementRule);
    } catch (e) {
      rules = [];
    }
  } else if (Array.isArray(incrementRule)) {
    rules = incrementRule;
  }

  if (!Array.isArray(rules) || rules.length === 0) {
    rules = [
      { threshold: 0, increment: 5 },
      { threshold: 100, increment: 10 }
    ];
  }

  const sorted = [...rules].sort((a, b) => b.threshold - a.threshold);
  for (const tier of sorted) {
    if (price >= tier.threshold) {
      return tier.increment;
    }
  }
  return 5; // default fallback
}

export async function broadcastRoomState(io: Server | any, roomId: string) {
  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        currentItem: {
          include: {
            bids: {
              orderBy: { createdAt: "desc" },
              include: {
                team: true
              }
            }
          }
        },
        teams: {
          include: {
            ownerParticipant: true,
            players: true
          }
        },
        participants: true
      }
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
        currentItemId: room.currentItemId,
        timerEndsAt: room.timerEndsAt ? room.timerEndsAt.toISOString() : null,
        currentItem: room.currentItem ? {
          id: room.currentItem.id,
          name: room.currentItem.name,
          category: room.currentItem.category,
          basePrice: room.currentItem.basePrice,
          imageUrl: room.currentItem.imageUrl,
          status: room.currentItem.status,
          auctionOrder: room.currentItem.auctionOrder,
          bids: room.currentItem.bids.map((b) => ({
            id: b.id,
            teamId: b.teamId,
            teamName: b.team.name,
            amount: b.amount,
            createdAt: b.createdAt.toISOString()
          }))
        } : null
      },
      teams: room.teams.map((t) => ({
        id: t.id,
        name: t.name,
        purseTotal: t.purseTotal,
        purseRemaining: t.purseRemaining,
        ownerParticipantId: t.ownerParticipantId,
        ownerParticipantName: t.ownerParticipant?.displayName || null,
        players: t.players.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          soldPrice: p.soldPrice
        }))
      })),
      participants: room.participants.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        role: p.role,
        connected: p.connected,
        lastSeenAt: p.lastSeenAt
      }))
    };

    io.to(roomId).emit("room:state", payload);
  } catch (error) {
    console.error("Error broadcasting room state:", error);
  }
}

export async function resolveCurrentItem(roomId: string, io: Server | any) {
  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        currentItem: {
          include: {
            bids: {
              orderBy: { createdAt: "desc" }
            }
          }
        }
      }
    });

    if (!room || !room.currentItem) return;

    const currentItem = room.currentItem;
    const bids = currentItem.bids;

    if (bids.length > 0) {
      // SOLD
      const highestBid = bids[0];
      await prisma.$transaction(async (tx) => {
        // Update Item status to SOLD
        await tx.item.update({
          where: { id: currentItem.id },
          data: {
            status: "SOLD",
            soldToTeamId: highestBid.teamId,
            soldPrice: highestBid.amount
          }
        });
        // Deduct team purse
        await tx.team.update({
          where: { id: highestBid.teamId },
          data: {
            purseRemaining: {
              decrement: highestBid.amount
            }
          }
        });
      });
      console.log(`Resolved item ${currentItem.name} as SOLD to team ${highestBid.teamId} for ${highestBid.amount}`);
    } else {
      // UNSOLD
      await prisma.item.update({
        where: { id: currentItem.id },
        data: {
          status: "UNSOLD"
        }
      });
      console.log(`Resolved item ${currentItem.name} as UNSOLD`);
    }

    // Load next pending player
    const nextItem = await prisma.item.findFirst({
      where: {
        roomId,
        status: "PENDING"
      },
      orderBy: {
        auctionOrder: "asc"
      }
    });

    if (nextItem) {
      const timerEndsAt = new Date(Date.now() + room.timerSeconds * 1000);
      await prisma.$transaction([
        prisma.item.update({
          where: { id: nextItem.id },
          data: { status: "IN_AUCTION" }
        }),
        prisma.room.update({
          where: { id: roomId },
          data: {
            currentItemId: nextItem.id,
            timerEndsAt
          }
        })
      ]);

      // Start timer for the next player
      startTimer(roomId, room.timerSeconds * 1000, () => resolveCurrentItem(roomId, io));
    } else {
      // No more players -> Room complete
      await prisma.room.update({
        where: { id: roomId },
        data: {
          status: "COMPLETED",
          currentItemId: null,
          timerEndsAt: null
        }
      });
    }

    await broadcastRoomState(io, roomId);
  } catch (error) {
    console.error(`Error resolving current item in room ${roomId}:`, error);
  }
}

export function handleAuctionConnection(socket: Socket, payload: SocketUserPayload, io: Server | any) {
  const { roomId, role } = payload;

  // 1. Room Start
  socket.on("room:start", async (data) => {
    try {
      const parsed = roomActionSchema.parse(data);
      
      // Authorization Check
      if (role !== "COMMISSIONER") {
        return socket.emit("error", { message: "Only the Commissioner can start the auction" });
      }

      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { currentItem: true }
      });

      if (!room) {
        return socket.emit("error", { message: "Room not found" });
      }

      if (room.status !== "LOBBY") {
        return socket.emit("error", { message: "Auction has already started" });
      }

      // Find first pending player
      const firstItem = await prisma.item.findFirst({
        where: {
          roomId,
          status: "PENDING"
        },
        orderBy: {
          auctionOrder: "asc"
        }
      });

      if (!firstItem) {
        // No players to auction -> mark room completed directly
        await prisma.room.update({
          where: { id: roomId },
          data: {
            status: "COMPLETED",
            currentItemId: null,
            timerEndsAt: null
          }
        });
      } else {
        const timerEndsAt = new Date(Date.now() + room.timerSeconds * 1000);
        await prisma.$transaction([
          prisma.item.update({
            where: { id: firstItem.id },
            data: { status: "IN_AUCTION" }
          }),
          prisma.room.update({
            where: {
              id: roomId
            },
            data: {
              status: "AUCTION",
              currentItemId: firstItem.id,
              timerEndsAt
            }
          })
        ]);

        // Start server-side countdown
        startTimer(roomId, room.timerSeconds * 1000, () => resolveCurrentItem(roomId, io));
      }

      await broadcastRoomState(io, roomId);
    } catch (err: any) {
      console.error("Error in room:start handler:", err);
      socket.emit("error", { message: err.message || "Failed to start auction" });
    }
  });

  // 2. Room Pause
  socket.on("room:pause", async (data) => {
    try {
      const parsed = roomActionSchema.parse(data);

      if (role !== "COMMISSIONER") {
        return socket.emit("error", { message: "Only the Commissioner can pause the auction" });
      }

      const room = await prisma.room.findUnique({
        where: { id: roomId }
      });

      if (!room || room.status !== "AUCTION") {
        return socket.emit("error", { message: "Auction is not actively running" });
      }

      // Clear countdown timer
      clearTimer(roomId);

      // Compute remaining time
      let remainingSeconds = room.timerSeconds;
      if (room.timerEndsAt) {
        remainingSeconds = Math.max(0, Math.ceil((room.timerEndsAt.getTime() - Date.now()) / 1000));
      }
      pausedTimeRemaining.set(roomId, remainingSeconds);

      // Update room status
      await prisma.room.update({
        where: { id: roomId },
        data: {
          status: "PAUSED",
          timerEndsAt: null
        }
      });

      await broadcastRoomState(io, roomId);
    } catch (err: any) {
      console.error("Error in room:pause handler:", err);
      socket.emit("error", { message: err.message || "Failed to pause auction" });
    }
  });

  // 3. Room Resume
  socket.on("room:resume", async (data) => {
    try {
      const parsed = roomActionSchema.parse(data);

      if (role !== "COMMISSIONER") {
        return socket.emit("error", { message: "Only the Commissioner can resume the auction" });
      }

      const room = await prisma.room.findUnique({
        where: { id: roomId }
      });

      if (!room || room.status !== "PAUSED") {
        return socket.emit("error", { message: "Auction is not paused" });
      }

      const remainingSeconds = pausedTimeRemaining.get(roomId) ?? room.timerSeconds;
      pausedTimeRemaining.delete(roomId);

      const timerEndsAt = new Date(Date.now() + remainingSeconds * 1000);
      await prisma.room.update({
        where: { id: roomId },
        data: {
          status: "AUCTION",
          timerEndsAt
        }
      });

      // Restart timer
      startTimer(roomId, remainingSeconds * 1000, () => resolveCurrentItem(roomId, io));

      await broadcastRoomState(io, roomId);
    } catch (err: any) {
      console.error("Error in room:resume handler:", err);
      socket.emit("error", { message: err.message || "Failed to resume auction" });
    }
  });

  // 4. Room Force Resolve
  socket.on("room:force-resolve", async (data) => {
    try {
      const parsed = forceResolveSchema.parse(data);

      if (role !== "COMMISSIONER") {
        return socket.emit("error", { message: "Only the Commissioner can force resolve an item" });
      }

      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
          currentItem: {
            include: {
              bids: {
                orderBy: { createdAt: "desc" }
              }
            }
          }
        }
      });

      if (!room || !room.currentItem || (room.status !== "AUCTION" && room.status !== "PAUSED")) {
        return socket.emit("error", { message: "No active item to resolve" });
      }

      // Clear active timer
      clearTimer(roomId);
      pausedTimeRemaining.delete(roomId);

      const currentItem = room.currentItem;
      const bids = currentItem.bids;

      if (parsed.outcome === "SOLD" && bids.length > 0) {
        // Force SOLD to highest bidder
        const highestBid = bids[0];
        await prisma.$transaction(async (tx) => {
          await tx.item.update({
            where: { id: currentItem.id },
            data: {
              status: "SOLD",
              soldToTeamId: highestBid.teamId,
              soldPrice: highestBid.amount
            }
          });
          await tx.team.update({
            where: { id: highestBid.teamId },
            data: {
              purseRemaining: {
                decrement: highestBid.amount
              }
            }
          });
        });
      } else {
        // Force UNSOLD or SOLD with no bids (defaults to UNSOLD)
        await prisma.item.update({
          where: { id: currentItem.id },
          data: {
            status: "UNSOLD"
          }
        });
      }

      // Load next pending player
      const nextItem = await prisma.item.findFirst({
        where: {
          roomId,
          status: "PENDING"
        },
        orderBy: {
          auctionOrder: "asc"
        }
      });

      if (nextItem) {
        const timerEndsAt = new Date(Date.now() + room.timerSeconds * 1000);
        await prisma.$transaction([
          prisma.item.update({
            where: { id: nextItem.id },
            data: { status: "IN_AUCTION" }
          }),
          prisma.room.update({
            where: { id: roomId },
            data: {
              status: "AUCTION",
              currentItemId: nextItem.id,
              timerEndsAt
            }
          })
        ]);

        // Start timer for the next player
        startTimer(roomId, room.timerSeconds * 1000, () => resolveCurrentItem(roomId, io));
      } else {
        // Complete Room
        await prisma.room.update({
          where: { id: roomId },
          data: {
            status: "COMPLETED",
            currentItemId: null,
            timerEndsAt: null
          }
        });
      }

      await broadcastRoomState(io, roomId);
    } catch (err: any) {
      console.error("Error in room:force-resolve handler:", err);
      socket.emit("error", { message: err.message || "Failed to force resolve item" });
    }
  });

  // 5. Bid Place
  socket.on("bid:place", async (data) => {
    try {
      const parsed = bidPlaceSchema.parse(data);

      // Verify the bid comes from the correct team owner
      if (role !== "TEAM_OWNER" || payload.teamId !== parsed.teamId) {
        return socket.emit("bid:rejected", { reason: "Unauthorized to place bids for this team" });
      }

      // Fetch room, team, and current item
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
          currentItem: {
            include: {
              bids: {
                orderBy: { createdAt: "desc" }
              }
            }
          }
        }
      });

      if (!room || room.status !== "AUCTION") {
        return socket.emit("bid:rejected", { reason: "Auction is not active" });
      }

      const currentItem = room.currentItem;
      if (!currentItem || currentItem.id !== parsed.itemId || currentItem.status !== "IN_AUCTION") {
        return socket.emit("bid:rejected", { reason: "Item is not up for auction" });
      }

      // Check timer expiration
      if (room.timerEndsAt && new Date() > new Date(room.timerEndsAt)) {
        return socket.emit("bid:rejected", { reason: "Bidding timer has expired" });
      }

      const team = await prisma.team.findUnique({
        where: { id: parsed.teamId }
      });

      if (!team) {
        return socket.emit("bid:rejected", { reason: "Team not found" });
      }

      // Validate Purse
      if (team.purseRemaining < parsed.amount) {
        return socket.emit("bid:rejected", { reason: "Insufficient remaining purse" });
      }

      // Validate Increment Rule
      const highestBid = currentItem.bids[0] || null;
      const currentPrice = highestBid ? highestBid.amount : currentItem.basePrice;
      const minBidRequired = highestBid ? (currentPrice + getIncrementForPrice(currentPrice, room.incrementRule)) : currentItem.basePrice;

      if (parsed.amount < minBidRequired) {
        return socket.emit("bid:rejected", { reason: `Bid amount must be at least ₹${minBidRequired} Lakhs` });
      }

      // Validate Squad Cap
      const squadSize = await prisma.item.count({
        where: { roomId, soldToTeamId: parsed.teamId, status: "SOLD" }
      });
      if (squadSize >= room.squadSizeCap) {
        return socket.emit("bid:rejected", { reason: "Squad size cap reached" });
      }

      // Validate Category Cap
      if (room.roleCaps) {
        const caps = room.roleCaps as Record<string, { min: number; max: number }>;
        const categoryCap = caps[currentItem.category];
        if (categoryCap) {
          const categoryCount = await prisma.item.count({
            where: { roomId, soldToTeamId: parsed.teamId, category: currentItem.category, status: "SOLD" }
          });
          if (categoryCount >= categoryCap.max) {
            return socket.emit("bid:rejected", { reason: `Category quota for ${currentItem.category} exceeded` });
          }
        }
      }

      // If all validations pass, save bid and reset timer
      const newTimerEndsAt = new Date(Date.now() + room.timerSeconds * 1000);
      
      const newBid = await prisma.$transaction(async (tx) => {
        // Create Bid
        const b = await tx.bid.create({
          data: {
            roomId,
            itemId: parsed.itemId,
            teamId: parsed.teamId,
            amount: parsed.amount
          }
        });
        // Update Room timer
        await tx.room.update({
          where: { id: roomId },
          data: {
            timerEndsAt: newTimerEndsAt
          }
        });
        return b;
      });

      // Reset the countdown timer
      startTimer(roomId, room.timerSeconds * 1000, () => resolveCurrentItem(roomId, io));

      // Broadcast bid accepted
      io.to(roomId).emit("bid:accepted", {
        itemId: parsed.itemId,
        teamId: parsed.teamId,
        amount: parsed.amount,
        timerEndsAt: newTimerEndsAt.toISOString()
      });

      // Broadcast room state
      await broadcastRoomState(io, roomId);
    } catch (err: any) {
      console.error("Error placing bid:", err);
      socket.emit("bid:rejected", { reason: "Internal server error placing bid" });
    }
  });

  // 7. Kick Participant
  socket.on("participant:kick", async (data) => {
    try {
      const parsed = kickParticipantSchema.parse(data);
      if (role !== "COMMISSIONER") {
        return socket.emit("error", { message: "Only the Commissioner can kick participants" });
      }

      const targetParticipant = await prisma.participant.findUnique({
        where: { id: parsed.participantId },
        include: { team: true }
      });

      if (!targetParticipant) {
        return socket.emit("error", { message: "Participant not found" });
      }

      if (targetParticipant.roomId !== roomId) {
        return socket.emit("error", { message: "Participant is not in this room" });
      }

      if (targetParticipant.role === "COMMISSIONER") {
        return socket.emit("error", { message: "The Commissioner cannot be kicked" });
      }

      // If target participant owns a team, release the team
      if (targetParticipant.role === "TEAM_OWNER") {
        await prisma.team.updateMany({
          where: { ownerParticipantId: targetParticipant.id },
          data: { ownerParticipantId: null }
        });
      }

      // Find target participant's socket(s) and disconnect them after informing them
      const namespace = socket.nsp;
      const socketsMap = await namespace.fetchSockets();
      for (const s of socketsMap) {
        const userPayload = (s as any).user as SocketUserPayload;
        if (userPayload && userPayload.participantId === targetParticipant.id) {
          s.emit("participant:kicked", { message: "You have been kicked by the Commissioner." });
          s.disconnect(true);
        }
      }

      // Delete target participant
      await prisma.participant.delete({
        where: { id: targetParticipant.id }
      });

      // Broadcast room state
      const updatedRoom = await prisma.room.findUnique({ where: { id: roomId } });
      if (updatedRoom) {
        if (updatedRoom.status === "LOBBY") {
          await broadcastLobbyState(io, roomId);
        } else {
          await broadcastRoomState(io, roomId);
        }
      }
    } catch (err: any) {
      console.error("Error kicking participant:", err);
      socket.emit("error", { message: err.message || "Failed to kick participant" });
    }
  });

  // 8. Room Disband
  socket.on("room:disband", async (data) => {
    try {
      const parsed = roomActionSchema.parse(data);
      if (role !== "COMMISSIONER") {
        return socket.emit("error", { message: "Only the Commissioner can disband the room" });
      }

      // Notify everyone in the room
      io.to(roomId).emit("room:disbanded", { message: "The auction has been disbanded by the Commissioner." });

      // Clean up timer
      clearTimer(roomId);
      pausedTimeRemaining.delete(roomId);

      // Perform cascade deletion in database
      await prisma.$transaction(async (tx) => {
        // 1. Clear room currentItem reference
        await tx.room.update({
          where: { id: roomId },
          data: { currentItemId: null }
        });

        // 2. Delete all Bids belonging to items or teams in this room
        await tx.bid.deleteMany({
          where: {
            team: { roomId: roomId }
          }
        });

        // 3. Delete all Items
        await tx.item.deleteMany({
          where: { roomId }
        });

        // 4. Delete all Teams
        await tx.team.deleteMany({
          where: { roomId }
        });

        // 5. Delete all Participants
        await tx.participant.deleteMany({
          where: { roomId }
        });

        // 6. Delete Room
        await tx.room.delete({
          where: { id: roomId }
        });
      });

      // Disconnect all sockets currently in this room
      const namespace = socket.nsp;
      const socketsMap = await namespace.in(roomId).fetchSockets();
      for (const s of socketsMap) {
        s.disconnect(true);
      }
    } catch (err: any) {
      console.error("Error disbanding room:", err);
      socket.emit("error", { message: err.message || "Failed to disband room" });
    }
  });
}
