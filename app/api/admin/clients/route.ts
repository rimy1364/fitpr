import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClientSchema } from "@/lib/validations";
import { sendInviteEmail } from "@/lib/resend";
import { addDays } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["ORG_ADMIN", "TRAINER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId!;
  const where =
    session.user.role === "TRAINER"
      ? { organizationId: orgId, role: "CLIENT" as const, clientProfile: { assignedTrainerId: session.user.id } }
      : { organizationId: orgId, role: "CLIENT" as const };

  const clients = await prisma.user.findMany({
    where,
    include: { clientProfile: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: clients });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["ORG_ADMIN", "TRAINER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId!;
  const body = await req.json();
  const parsed = createClientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, email, phone, assignedTrainerId, goal } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }

  const invite = await prisma.orgInvite.create({
    data: {
      email,
      organizationId: orgId,
      role: "CLIENT",
      expiresAt: addDays(new Date(), 2),
    },
    include: { organization: { select: { name: true } } },
  });

  const user = await prisma.user.create({
    data: {
      email,
      name,
      phone,
      role: "CLIENT",
      organizationId: orgId,
      isActive: false,
    },
  });

  await prisma.clientProfile.create({
    data: {
      userId: user.id,
      assignedTrainerId: assignedTrainerId ?? null,
      goal: goal ?? null,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await sendInviteEmail({
    to: email,
    name,
    orgName: invite.organization.name,
    role: "CLIENT",
    setupUrl: `${appUrl}/setup-account/${invite.token}`,
  });

  return NextResponse.json({ data: user }, { status: 201 });
}
