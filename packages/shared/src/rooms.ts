import { z } from "zod";

export const createRoomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  defaultPurse: z.number().int().positive("Default purse must be positive (in Lakhs)"),
  squadSizeCap: z.number().int().positive("Squad size cap must be positive").default(18),
  roleCaps: z.record(z.object({
    min: z.number().int().nonnegative(),
    max: z.number().int().positive()
  })).optional().nullable(),
  timerSeconds: z.number().int().positive("Timer seconds must be positive").default(15),
  incrementRule: z.array(z.object({
    threshold: z.number().int().nonnegative(),
    increment: z.number().int().positive()
  })).default([
    { threshold: 0, increment: 5 },
    { threshold: 100, increment: 10 }
  ]),
  teams: z.array(z.object({
    name: z.string().min(1, "Team name is required")
  })).min(1, "At least one team is required"),
  players: z.array(z.object({
    name: z.string().min(1, "Player name is required"),
    category: z.string().min(1, "Player category is required"),
    basePrice: z.number().int().positive("Base price must be positive (in Lakhs)"),
    imageUrl: z.string().optional().nullable()
  })).min(1, "At least one player is required")
}).refine(data => {
  const teamNames = data.teams.map(t => t.name.trim().toLowerCase());
  return new Set(teamNames).size === teamNames.length;
}, {
  message: "Team names must be unique",
  path: ["teams"]
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const joinRoomSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  role: z.enum(["TEAM_OWNER", "SPECTATOR"]),
  teamId: z.string().optional().nullable(),
  anonId: z.string().min(1, "anonId is required")
}).refine(data => {
  if (data.role === "TEAM_OWNER" && !data.teamId) {
    return false;
  }
  if (data.role === "SPECTATOR" && data.teamId) {
    return false;
  }
  return true;
}, {
  message: "Team Owner requires teamId, Spectator must not have teamId",
  path: ["teamId"]
});

export type JoinRoomInput = z.infer<typeof joinRoomSchema>;

export const roomCodeSchema = z.object({
  code: z.string().length(6, "Room code must be exactly 6 characters").regex(/^[A-Z0-9]+$/, "Room code must be alphanumeric uppercase")
});

export type RoomCodeParam = z.infer<typeof roomCodeSchema>;

export const errorResponseSchema = z.object({
  ok: z.literal(false),
  code: z.string(),
  message: z.string()
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export const lobbySnapshotSchema = z.object({
  ok: z.literal(true),
  room: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    status: z.string(),
    defaultPurse: z.number(),
    squadSizeCap: z.number(),
    roleCaps: z.any().nullable(),
    timerSeconds: z.number(),
    incrementRule: z.any()
  }),
  teams: z.array(z.object({
    id: z.string(),
    name: z.string(),
    purseTotal: z.number(),
    purseRemaining: z.number(),
    ownerParticipantId: z.string().nullable(),
    ownerParticipantName: z.string().nullable().optional()
  })),
  participants: z.array(z.object({
    id: z.string(),
    displayName: z.string(),
    role: z.string(),
    connected: z.boolean(),
    lastSeenAt: z.any()
  }))
});

export type LobbySnapshot = z.infer<typeof lobbySnapshotSchema>;

export const bidPlaceSchema = z.object({
  roomCode: z.string().length(6, "Room code must be exactly 6 characters"),
  itemId: z.string().min(1, "Item ID is required"),
  teamId: z.string().min(1, "Team ID is required"),
  amount: z.number().int().positive("Bid amount must be a positive integer"),
});

export type BidPlaceInput = z.infer<typeof bidPlaceSchema>;

export const roomActionSchema = z.object({
  roomCode: z.string().length(6, "Room code must be exactly 6 characters"),
});

export type RoomActionInput = z.infer<typeof roomActionSchema>;

export const forceResolveSchema = z.object({
  roomCode: z.string().length(6, "Room code must be exactly 6 characters"),
  outcome: z.enum(["SOLD", "UNSOLD"]),
});

export type ForceResolveInput = z.infer<typeof forceResolveSchema>;

export const kickParticipantSchema = z.object({
  roomCode: z.string().length(6, "Room code must be exactly 6 characters"),
  participantId: z.string().min(1, "Participant ID is required"),
});

export type KickParticipantInput = z.infer<typeof kickParticipantSchema>;

