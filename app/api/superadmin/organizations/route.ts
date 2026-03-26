import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOrgSchema } from "@/lib/validations";
import { sendInviteEmail } from "@/lib/resend";
import { addDays } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");

  const orgs = await prisma.organization.findMany({
    where: status ? { status: status as "ACTIVE" | "TRIAL" | "SUSPENDED" | "CANCELLED" } : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true } } },
  });

  return NextResponse.json({ data: orgs });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createOrgSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, slug, email, phone, address, plan, adminName, adminEmail } = parsed.data;

  // Check slug uniqueness
  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug is already taken" }, { status: 409 });
  }

  // Check org email uniqueness
  const existingOrg = await prisma.organization.findUnique({ where: { email } });
  if (existingOrg) {
    return NextResponse.json({ error: "An organisation with this email already exists" }, { status: 409 });
  }

  // Check admin email doesn't exist
  const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingUser) {
    return NextResponse.json({ error: "An account with this admin email already exists" }, { status: 409 });
  }

  const planLimits = {
    STARTER: { maxTrainers: 3, maxClients: 30 },
    GROWTH: { maxTrainers: 10, maxClients: 100 },
    PRO: { maxTrainers: -1, maxClients: -1 },
  };

  const limits = planLimits[plan];

  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      email,
      phone,
      address,
      status: "TRIAL",
      subscriptionPlan: plan,
      subscriptionStatus: "TRIAL",
      maxTrainers: limits.maxTrainers,
      maxClients: limits.maxClients,
      trialEndsAt: addDays(new Date(), 14),
      createdBy: session.user.id,
    },
  });

  // Create invite for org admin
  const invite = await prisma.orgInvite.create({
    data: {
      email: adminEmail,
      organizationId: org.id,
      role: "ORG_ADMIN",
      expiresAt: addDays(new Date(), 2),
    },
  });

  // Send invite email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await sendInviteEmail({
    to: adminEmail,
    name: adminName,
    orgName: name,
    role: "ORG_ADMIN",
    setupUrl: `${appUrl}/setup-account/${invite.token}`,
  });

  return NextResponse.json({ data: org }, { status: 201 });
}
