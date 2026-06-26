import { NextRequest, NextResponse } from "next/server";
import { roomCodeSchema } from "@bidstand/shared";
import { prisma } from "@bidstand/db";
import { verifyCommissionerToken, signParticipantToken } from "@/lib/auth";

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
            ownerParticipant: true
          }
        },
        participants: true
      }
    });

    if (!room) {
      return NextResponse.json(
        { ok: false, code: "ROOM_NOT_FOUND", message: "Room not found" },
        { status: 404 }
      );
    }

    // Check if the request is from the room's Commissioner
    let token: string | null = null;
    const commCookie = req.cookies.get("commissioner_token");
    if (commCookie) {
      const commissioner = await verifyCommissionerToken(commCookie.value);
      if (commissioner && commissioner.userId === room.commissionerId) {
        // Upsert Commissioner Participant row
        const anonId = `commissioner_${commissioner.userId}`;
        let participant = room.participants.find(p => p.anonId === anonId);
        
        if (!participant) {
          participant = await prisma.participant.create({
            data: {
              roomId: room.id,
              displayName: commissioner.name + " (Commissioner)",
              role: "COMMISSIONER",
              anonId,
              connected: true
            }
          });
          // Add to array for response
          room.participants.push(participant);
        }

        token = await signParticipantToken({
          roomId: room.id,
          participantId: participant.id,
          role: "COMMISSIONER",
          teamId: null
        });
      }
    }

    return NextResponse.json({
      ok: true,
      token,
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
      teams: room.teams.map(t => ({
        id: t.id,
        name: t.name,
        purseTotal: t.purseTotal,
        purseRemaining: t.purseRemaining,
        ownerParticipantId: t.ownerParticipantId,
        ownerParticipantName: t.ownerParticipant?.displayName || null
      })),
      participants: room.participants.map(p => ({
        id: p.id,
        displayName: p.displayName,
        role: p.role,
        connected: p.connected,
        lastSeenAt: p.lastSeenAt
      }))
    });
  } catch (error: any) {
    console.error("Fetch room error:", error);
    return NextResponse.json(
      { ok: false, code: "SERVER_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
