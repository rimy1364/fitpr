import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTrainerSchema } from "@/lib/validations";
import { sendInviteEmail } from "@/lib/resend";
import { addDays } from "date-fns";

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

  const { name, email, phone, bio, specializations, salary } = parsed.data;

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

  // Create invite
  const invite = await prisma.orgInvite.create({
    data: {
      email,
      organizationId: orgId,
      role: "TRAINER",
      expiresAt: addDays(new Date(), 2),
    },
    include: { organization: { select: { name: true } } },
  });

  // Pre-create the user so their profile can be set
  const user = await prisma.user.create({
    data: {
      email,
      name,
      phone,
      role: "TRAINER",
      organizationId: orgId,
      isActive: false, // activated after invite accepted
    },
  });

  await prisma.trainerProfile.create({
    data: { userId: user.id, bio, specializations, salary },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await sendInviteEmail({
    to: email,
    name,
    orgName: invite.organization.name,
    role: "TRAINER",
    setupUrl: `${appUrl}/setup-account/${invite.token}`,
  });

  return NextResponse.json({ data: user }, { status: 201 });
}
