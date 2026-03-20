import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateOrgSchema } from "@/lib/validations";

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

  const body = await req.json();
  const parsed = updateOrgSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const data = parsed.data;

  // Update plan limits if plan changed
  if (data.subscriptionPlan) {
    const planLimits = {
      STARTER: { maxTrainers: 3, maxClients: 30 },
      GROWTH: { maxTrainers: 10, maxClients: 100 },
      PRO: { maxTrainers: -1, maxClients: -1 },
    };
    const limits = planLimits[data.subscriptionPlan];
    Object.assign(data, limits);
  }

  const { id: patchId } = await params;
  const org = await prisma.organization.update({
    where: { id: patchId },
    data,
  });

  return NextResponse.json({ data: org });
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: deleteId } = await params;
  // Soft delete by cancelling
  await prisma.organization.update({
    where: { id: deleteId },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ success: true });
}
