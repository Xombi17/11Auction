import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@bidstand/shared";
import { prisma } from "@bidstand/db";
import bcryptjs from "bcryptjs";
import { signCommissionerToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, code: "INVALID_INPUT", message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { ok: false, code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Compare passwords
    const match = await bcryptjs.compare(password, user.passwordHash);
    if (!match) {
      return NextResponse.json(
        { ok: false, code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Sign Commissioner JWT
    const token = await signCommissionerToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: "COMMISSIONER",
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    // Set HTTP-only cookie
    response.cookies.set("commissioner_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { ok: false, code: "SERVER_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
