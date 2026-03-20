import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrgSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createOrgSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, slug, email, phone, address, plan, adminName, adminEmail } = parsed.data;

  // Check slug uniqueness
  const existingSlug = await prisma.organization.findUnique({ where: { slug } });
  if (existingSlug) {
    return NextResponse.json(
      { error: "This slug is already taken. Please choose a different one." },
      { status: 409 }
    );
  }

  // Check admin email not already registered
  const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingUser) {
    return NextResponse.json(
      { error: "An account with this admin email already exists." },
      { status: 409 }
    );
  }

  // Check if this org email already submitted a pending application
  const existingOrg = await prisma.organization.findFirst({
    where: { email, status: "PENDING" },
  });
  if (existingOrg) {
    return NextResponse.json(
      { error: "An application with this account email is already under review." },
      { status: 409 }
    );
  }

  const planLimits = {
    STARTER: { maxTrainers: 3, maxClients: 30 },
    GROWTH: { maxTrainers: 10, maxClients: 100 },
    PRO: { maxTrainers: -1, maxClients: -1 },
  };

  const limits = planLimits[plan];

  await prisma.organization.create({
    data: {
      name,
      slug,
      email,
      phone,
      address,
      status: "PENDING",
      subscriptionPlan: plan,
      subscriptionStatus: "TRIAL",
      maxTrainers: limits.maxTrainers,
      maxClients: limits.maxClients,
      pendingAdminName: adminName,
      pendingAdminEmail: adminEmail,
    },
  });

  return NextResponse.json(
    { message: "Application submitted. You will receive an invite once approved." },
    { status: 201 }
  );
}
