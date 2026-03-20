import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "next-auth/react";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Missing token or password" }, { status: 400 });
    }

    const invite = await prisma.orgInvite.findUnique({
      where: { token },
      include: { organization: true },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
    }
    if (invite.acceptedAt) {
      return NextResponse.json({ error: "This invite has already been used" }, { status: 400 });
    }
    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "This invite link has expired" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create or update user
    const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword, isActive: true },
      });
    } else {
      // Determine role
      const roleMap = {
        ORG_ADMIN: "ORG_ADMIN",
        TRAINER: "TRAINER",
        CLIENT: "CLIENT",
      } as const;

      const user = await prisma.user.create({
        data: {
          email: invite.email,
          password: hashedPassword,
          name: invite.email.split("@")[0], // placeholder; updated in onboarding
          role: roleMap[invite.role],
          organizationId: invite.organizationId,
          isActive: true,
        },
      });

      // Create profile records
      if (invite.role === "TRAINER") {
        await prisma.trainerProfile.create({ data: { userId: user.id } });
      } else if (invite.role === "CLIENT") {
        await prisma.clientProfile.create({ data: { userId: user.id } });
      }
    }

    // Mark invite as accepted
    await prisma.orgInvite.update({
      where: { token },
      data: { acceptedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Setup account error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
