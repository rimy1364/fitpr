import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTrainerSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ORG_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trainers = await prisma.user.findMany({
    where: { organizationId: session.user.organizationId!, role: "TRAINER" },
    include: { trainerProfile: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: trainers });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ORG_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId!;
  const body = await req.json();
  const parsed = createTrainerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, email, password, phone, bio, specializations, perClientFee } = parsed.data;

  // Check org trainer limit
  const [org, trainerCount] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { maxTrainers: true } }),
    prisma.user.count({ where: { organizationId: orgId, role: "TRAINER", isActive: true } }),
  ]);

  if (org && org.maxTrainers !== -1 && trainerCount >= org.maxTrainers) {
    return NextResponse.json({ error: "Trainer limit reached for your plan" }, { status: 403 });
  }

  // Check email not taken
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      phone,
      password: hashedPassword,
      role: "TRAINER",
      organizationId: orgId,
      isActive: true,
    },
  });

  await prisma.trainerProfile.create({
    data: { userId: user.id, bio, specializations, perClientFee },
  });

  return NextResponse.json({ data: user }, { status: 201 });
}
