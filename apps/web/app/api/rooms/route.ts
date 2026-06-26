import { NextRequest, NextResponse } from "next/server";
import { createRoomSchema } from "@bidstand/shared";
import { prisma } from "@bidstand/db";
import { verifyCommissionerToken } from "@/lib/auth";

// Helper to generate 6-character room code
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
    // 1. Authenticate commissioner
    const cookie = req.cookies.get("commissioner_token");
    if (!cookie) {
      return NextResponse.json(
        { ok: false, code: "UNAUTHORIZED", message: "You must be logged in as a Commissioner" },
        { status: 401 }
      );
    }

    const commissioner = await verifyCommissionerToken(cookie.value);
    if (!commissioner) {
      return NextResponse.json(
        { ok: false, code: "UNAUTHORIZED", message: "Session invalid or expired" },
        { status: 401 }
      );
    }

    // 2. Parse and validate body
    const body = await req.json();
    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, code: "INVALID_INPUT", message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, defaultPurse, squadSizeCap, roleCaps, timerSeconds, incrementRule, teams, players } = parsed.data;

    // 3. Generate unique room code (collision retry up to 5 times)
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
        { ok: false, code: "CODE_COLLISION", message: "Unable to generate unique room code. Please try again." },
        { status: 500 }
      );
    }

    // 4. Create Room, Teams, and Players in a single transaction
    const room = await prisma.$transaction(async (tx) => {
      const createdRoom = await tx.room.create({
        data: {
          code,
          name,
          commissionerId: commissioner.userId,
          defaultPurse,
          squadSizeCap,
          roleCaps: roleCaps as any,
          timerSeconds,
          incrementRule: incrementRule as any,
          status: "LOBBY",
        },
      });

      // Create all Teams
      await Promise.all(
        teams.map((t) =>
          tx.team.create({
            data: {
              roomId: createdRoom.id,
              name: t.name,
              purseTotal: defaultPurse,
              purseRemaining: defaultPurse,
            },
          })
        )
      );

      // Create all Items (Players)
      await Promise.all(
        players.map((p, index) =>
          tx.item.create({
            data: {
              roomId: createdRoom.id,
              name: p.name,
              category: p.category,
              basePrice: p.basePrice,
              imageUrl: p.imageUrl || null,
              auctionOrder: index + 1,
              status: "PENDING",
            },
          })
        )
      );

      return createdRoom;
    });

    const teamCount = teams.length;
    const playerCount = players.length;

    return NextResponse.json({
      ok: true,
      room: {
        id: room.id,
        code: room.code,
        name: room.name,
        status: room.status,
        teamCount,
        playerCount,
      },
    });
  } catch (error: any) {
    console.error("Room creation error:", error);
    return NextResponse.json(
      { ok: false, code: "SERVER_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get("commissioner_token");
    if (!cookie) {
      return NextResponse.json(
        { ok: false, code: "UNAUTHORIZED", message: "You must be logged in as a Commissioner" },
        { status: 401 }
      );
    }

    const commissioner = await verifyCommissionerToken(cookie.value);
    if (!commissioner) {
      return NextResponse.json(
        { ok: false, code: "UNAUTHORIZED", message: "Session invalid or expired" },
        { status: 401 }
      );
    }

    const rooms = await prisma.room.findMany({
      where: { commissionerId: commissioner.userId },
      include: {
        _count: {
          select: {
            teams: true,
            items: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      rooms: rooms.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        status: r.status,
        teamCount: r._count.teams,
        playerCount: r._count.items,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Fetch rooms error:", error);
    return NextResponse.json(
      { ok: false, code: "SERVER_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

