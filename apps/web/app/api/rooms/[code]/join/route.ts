import { NextRequest, NextResponse } from "next/server";
import { joinRoomSchema, roomCodeSchema } from "@bidstand/shared";
import { prisma } from "@bidstand/db";
import { signParticipantToken } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    // 1. Validate room code parameter
    const codeParsed = roomCodeSchema.safeParse({ code: params.code.toUpperCase() });
    if (!codeParsed.success) {
      return NextResponse.json(
        { ok: false, code: "INVALID_ROOM_CODE", message: "Room code must be 6 alphanumeric characters" },
        { status: 400 }
      );
    }

    const { code } = codeParsed.data;

    // Lookup room
    const room = await prisma.room.findUnique({
      where: { code },
      include: { teams: true },
    });

    if (!room) {
      return NextResponse.json(
        { ok: false, code: "ROOM_NOT_FOUND", message: "The requested auction room does not exist" },
        { status: 404 }
      );
    }

    // 2. Validate request body
    const body = await req.json();
    const parsed = joinRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, code: "INVALID_INPUT", message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { displayName, role, teamId, anonId } = parsed.data;

    // 3. Rejoin logic: check if participant already exists by roomId + anonId
    const existingParticipant = await prisma.participant.findUnique({
      where: { roomId_anonId: { roomId: room.id, anonId } },
      include: { team: true },
    });

    if (existingParticipant) {
      // Re-sign token and return success
      const token = await signParticipantToken({
        roomId: room.id,
        participantId: existingParticipant.id,
        role: existingParticipant.role as any,
        teamId: existingParticipant.team?.id || null,
      });

      const response = NextResponse.json({
        ok: true,
        token,
        participant: {
          id: existingParticipant.id,
          displayName: existingParticipant.displayName,
          role: existingParticipant.role,
          teamId: existingParticipant.team?.id || null,
        },
      });

      response.cookies.set("room_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return response;
    }

    // 4. Create new participant
    let participantId = "";
    let finalTeamId: string | null = null;

    if (role === "TEAM_OWNER") {
      if (!teamId) {
        return NextResponse.json(
          { ok: false, code: "TEAM_REQUIRED", message: "Team Owner role requires selecting a team" },
          { status: 400 }
        );
      }

      // Verify team is in this room
      const targetTeam = room.teams.find((t) => t.id === teamId);
      if (!targetTeam) {
        return NextResponse.json(
          { ok: false, code: "TEAM_NOT_FOUND", message: "Selected team is not part of this room" },
          { status: 404 }
        );
      }

      // Verify team is unclaimed
      if (targetTeam.ownerParticipantId) {
        return NextResponse.json(
          { ok: false, code: "TEAM_ALREADY_CLAIMED", message: "This team has already been claimed by another owner" },
          { status: 409 }
        );
      }

      // Claim team in transaction
      const result = await prisma.$transaction(async (tx) => {
        const participant = await tx.participant.create({
          data: {
            roomId: room.id,
            displayName,
            role,
            anonId,
            connected: true,
          },
        });

        await tx.team.update({
          where: { id: teamId },
          data: { ownerParticipantId: participant.id },
        });

        return participant;
      });

      participantId = result.id;
      finalTeamId = teamId;
    } else {
      // Spectator
      const participant = await prisma.participant.create({
        data: {
          roomId: room.id,
          displayName,
          role,
          anonId,
          connected: true,
        },
      });

      participantId = participant.id;
    }

    // 5. Sign token and set cookie
    const token = await signParticipantToken({
      roomId: room.id,
      participantId,
      role,
      teamId: finalTeamId,
    });

    const response = NextResponse.json({
      ok: true,
      token,
      participant: {
        id: participantId,
        displayName,
        role,
        teamId: finalTeamId,
      },
    });

    response.cookies.set("room_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error("Join room error:", error);
    return NextResponse.json(
      { ok: false, code: "SERVER_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
