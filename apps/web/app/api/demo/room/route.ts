import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@bidstand/db";
import { signCommissionerToken } from "@/lib/auth";

const PRESET_TEAMS = [
  "Mumbai Indians",
  "Chennai Super Kings",
  "Royal Challengers Bengaluru",
  "Kolkata Knight Riders",
  "Rajasthan Royals",
  "Gujarat Titans",
  "Sunrisers Hyderabad",
  "Lucknow Super Giants"
];

const PRESET_PLAYERS = [
  { name: "Virat Kohli", category: "Batsman", basePrice: 200 },
  { name: "Jasprit Bumrah", category: "Bowler", basePrice: 200 },
  { name: "MS Dhoni", category: "Wicketkeeper", basePrice: 200 },
  { name: "Ravindra Jadeja", category: "All-rounder", basePrice: 150 },
  { name: "Suryakumar Yadav", category: "Batsman", basePrice: 150 },
  { name: "Hardik Pandya", category: "All-rounder", basePrice: 150 },
  { name: "Rashid Khan", category: "Bowler", basePrice: 150 },
  { name: "Heinrich Klaasen", category: "Wicketkeeper", basePrice: 150 },
  { name: "Rohit Sharma", category: "Batsman", basePrice: 200 },
  { name: "Mitchell Starc", category: "Bowler", basePrice: 200 },
  { name: "Nicholas Pooran", category: "Wicketkeeper", basePrice: 150 },
  { name: "Glenn Maxwell", category: "All-rounder", basePrice: 100 }
];

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    let commissioner = null;
    const cookie = req.cookies.get("commissioner_token");
    
    if (cookie) {
      const { verifyCommissionerToken } = await import("@/lib/auth");
      commissioner = await verifyCommissionerToken(cookie.value);
    }

    let commissionerId: string;
    
    if (commissioner) {
      commissionerId = commissioner.userId;
    } else {
      const demoUser = await prisma.user.upsert({
        where: { email: "demo@bidstand.local" },
        update: {},
        create: {
          email: "demo@bidstand.local",
          passwordHash: "demo-hash",
          name: "Demo Commissioner"
        }
      });
      commissionerId = demoUser.id;
    }

    let code = "";
    let roomWithCode = null;
    let retries = 0;
    do {
      code = generateCode();
      roomWithCode = await prisma.room.findUnique({ where: { code } });
      retries++;
    } while (roomWithCode && retries < 5);

    if (roomWithCode) {
      return NextResponse.json(
        { ok: false, code: "CODE_COLLISION", message: "Unable to generate unique room code" },
        { status: 500 }
      );
    }

    const room = await prisma.$transaction(async (tx) => {
      const createdRoom = await tx.room.create({
        data: {
          code,
          name: "Demo Auction Room",
          commissionerId,
          defaultPurse: 10000,
          squadSizeCap: 18,
          roleCaps: {
            Batsman: { min: 4, max: 8 },
            Bowler: { min: 4, max: 8 },
            "All-rounder": { min: 2, max: 5 },
            Wicketkeeper: { min: 1, max: 3 }
          },
          timerSeconds: 15,
          incrementRule: [
            { threshold: 0, increment: 5 },
            { threshold: 100, increment: 10 },
            { threshold: 500, increment: 20 }
          ],
          status: "LOBBY",
        },
      });

      await Promise.all(
        PRESET_TEAMS.map((t) =>
          tx.team.create({
            data: {
              roomId: createdRoom.id,
              name: t,
              purseTotal: 10000,
              purseRemaining: 10000,
            },
          })
        )
      );

      await Promise.all(
        PRESET_PLAYERS.map((p, index) =>
          tx.item.create({
            data: {
              roomId: createdRoom.id,
              name: p.name,
              category: p.category,
              basePrice: p.basePrice,
              auctionOrder: index + 1,
              status: "PENDING",
            },
          })
        )
      );

      return createdRoom;
    });

    const token = await signCommissionerToken({
      userId: commissionerId,
      email: commissioner?.email || "demo@bidstand.local",
      name: commissioner?.name || "Demo Commissioner",
      role: "COMMISSIONER",
    });

    const response = NextResponse.json({
      ok: true,
      room: {
        id: room.id,
        code: room.code,
        name: room.name,
        status: room.status,
      },
    });

    response.cookies.set("commissioner_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error: any) {
    console.error("Demo room creation error:", error);
    return NextResponse.json(
      { ok: false, code: "SERVER_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}