import { NextRequest, NextResponse } from "next/server";
import { roomCodeSchema } from "@bidstand/shared";
import { prisma } from "@bidstand/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const codeParsed = roomCodeSchema.safeParse({ code: params.code.toUpperCase() });
    if (!codeParsed.success) {
      return NextResponse.json(
        { ok: false, code: "INVALID_ROOM_CODE", message: "Room code must be 6 alphanumeric characters" },
        { status: 400 }
      );
    }

    const { code } = codeParsed.data;

    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        teams: {
          include: {
            ownerParticipant: true,
            players: {
              orderBy: { name: "asc" }
            }
          },
          orderBy: {
            name: "asc"
          }
        },
        items: {
          where: {
            status: "UNSOLD"
          },
          orderBy: {
            name: "asc"
          }
        }
      }
    });

    if (!room) {
      return NextResponse.json(
        { ok: false, code: "ROOM_NOT_FOUND", message: "Room not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      room: {
        id: room.id,
        code: room.code,
        name: room.name,
        status: room.status,
        defaultPurse: room.defaultPurse,
        squadSizeCap: room.squadSizeCap,
      },
      teams: room.teams.map((t) => ({
        id: t.id,
        name: t.name,
        purseTotal: t.purseTotal,
        purseRemaining: t.purseRemaining,
        ownerParticipantName: t.ownerParticipant?.displayName || null,
        players: t.players.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          soldPrice: p.soldPrice
        }))
      })),
      unsoldPlayers: room.items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        basePrice: item.basePrice
      }))
    });
  } catch (error: any) {
    console.error("Fetch results error:", error);
    return NextResponse.json(
      { ok: false, code: "SERVER_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
