import { NextRequest, NextResponse } from "next/server";
import { signupSchema } from "@bidstand/shared";
import { prisma } from "@bidstand/db";
import bcryptjs from "bcryptjs";
import { signCommissionerToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, code: "INVALID_INPUT", message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { ok: false, code: "USER_EXISTS", message: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    // Sign Commissioner JWT (auto-login after signup)
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
    console.error("Signup error:", error);
    return NextResponse.json(
      { ok: false, code: "SERVER_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
