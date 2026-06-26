import * as jose from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ROOM_JWT_SECRET || "fallback-secret-for-development-only-replace-in-env"
);

export interface CommissionerPayload {
  userId: string;
  email: string;
  name: string;
  role: "COMMISSIONER";
}

export interface ParticipantPayload {
  roomId: string;
  participantId: string;
  role: "COMMISSIONER" | "TEAM_OWNER" | "SPECTATOR";
  teamId?: string | null;
}

export async function signCommissionerToken(payload: CommissionerPayload): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyCommissionerToken(token: string): Promise<CommissionerPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload as unknown as CommissionerPayload;
  } catch (err) {
    return null;
  }
}

export async function signParticipantToken(payload: ParticipantPayload): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyParticipantToken(token: string): Promise<ParticipantPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload as unknown as ParticipantPayload;
  } catch (err) {
    return null;
  }
}
