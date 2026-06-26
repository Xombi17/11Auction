import { describe, it, expect } from "vitest";
import { createRoomSchema, joinRoomSchema } from "./rooms.js";

describe("createRoomSchema", () => {
  const validPayload = {
    name: "IPL 2026 Auction",
    defaultPurse: 10000, // 100 Crore = 10000 Lakhs
    squadSizeCap: 18,
    timerSeconds: 15,
    incrementRule: [{ threshold: 0, increment: 5 }],
    teams: [
      { name: "Mumbai Indians" },
      { name: "Chennai Super Kings" }
    ],
    players: [
      { name: "Jasprit Bumrah", category: "Bowler", basePrice: 200 },
      { name: "MS Dhoni", category: "Wicketkeeper", basePrice: 200 }
    ]
  };

  it("should accept a valid payload", () => {
    const res = createRoomSchema.safeParse(validPayload);
    expect(res.success).toBe(true);
  });

  it("should reject duplicate team names", () => {
    const payload = {
      ...validPayload,
      teams: [
        { name: "Mumbai Indians" },
        { name: "mumbai indians" }
      ]
    };
    const res = createRoomSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });

  it("should reject empty teams array", () => {
    const payload = {
      ...validPayload,
      teams: []
    };
    const res = createRoomSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });

  it("should reject empty players array", () => {
    const payload = {
      ...validPayload,
      players: []
    };
    const res = createRoomSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });

  it("should reject non-positive base price", () => {
    const payload = {
      ...validPayload,
      players: [
        { name: "A", category: "Bowler", basePrice: 0 }
      ]
    };
    const res = createRoomSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });
});

describe("joinRoomSchema", () => {
  it("should accept spectator without teamId", () => {
    const res = joinRoomSchema.safeParse({
      displayName: "John Spectator",
      role: "SPECTATOR",
      teamId: null,
      anonId: "anon-123"
    });
    expect(res.success).toBe(true);
  });

  it("should accept team owner with teamId", () => {
    const res = joinRoomSchema.safeParse({
      displayName: "Jane Owner",
      role: "TEAM_OWNER",
      teamId: "team-id-1",
      anonId: "anon-456"
    });
    expect(res.success).toBe(true);
  });

  it("should reject spectator with teamId", () => {
    const res = joinRoomSchema.safeParse({
      displayName: "Bad Spectator",
      role: "SPECTATOR",
      teamId: "team-id-1",
      anonId: "anon-789"
    });
    expect(res.success).toBe(false);
  });

  it("should reject team owner without teamId", () => {
    const res = joinRoomSchema.safeParse({
      displayName: "Bad Owner",
      role: "TEAM_OWNER",
      teamId: null,
      anonId: "anon-789"
    });
    expect(res.success).toBe(false);
  });
});
