import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, password } = body;

    if (!token || !password || password.length < 8) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const record = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { email: record.email },
        data: { password: hashed },
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
