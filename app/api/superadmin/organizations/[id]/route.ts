import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateOrgSchema } from "@/lib/validations";
import { sendInviteEmail } from "@/lib/resend";
import { addDays } from "date-fns";

interface Params { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      users: {
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { users: true, clientPayments: true } },
    },
  });

  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: org });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // ── Special action: approve a pending org ──────────────────
  if (body.action === "approve") {
    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (org.status !== "PENDING") {
      return NextResponse.json({ error: "Organisation is not pending approval" }, { status: 400 });
    }
    if (!org.pendingAdminEmail) {
      return NextResponse.json({ error: "No admin email on record" }, { status: 400 });
    }

    // Create invite for org admin
    const invite = await prisma.orgInvite.create({
      data: {
        email: org.pendingAdminEmail,
        organizationId: org.id,
        role: "ORG_ADMIN",
        expiresAt: addDays(new Date(), 7),
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await sendInviteEmail({
      to: org.pendingAdminEmail,
      name: org.pendingAdminName ?? "Admin",
      orgName: org.name,
      role: "ORG_ADMIN",
      setupUrl: `${appUrl}/setup-account/${invite.token}`,
    });

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        status: "TRIAL",
        subscriptionStatus: "TRIAL",
        trialEndsAt: addDays(new Date(), 7),
        pendingAdminName: null,
        pendingAdminEmail: null,
      },
    });

    return NextResponse.json({ data: updated });
  }

  // ── Standard update ────────────────────────────────────────
  const parsed = updateOrgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const data = parsed.data;

  if (data.subscriptionPlan) {
    const planLimits = {
      STARTER: { maxTrainers: 3, maxClients: 30 },
      GROWTH: { maxTrainers: 10, maxClients: 100 },
      PRO: { maxTrainers: -1, maxClients: -1 },
    };
    const limits = planLimits[data.subscriptionPlan];
    Object.assign(data, limits);
  }

  const org = await prisma.organization.update({ where: { id }, data });
  return NextResponse.json({ data: org });
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.organization.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ success: true });
}
