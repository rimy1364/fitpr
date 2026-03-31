import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMonths, startOfDay } from "date-fns";

// Helper: "2025-Q1" etc.
function currentBillingPeriod() {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

function quarterDueDate(period: string): Date {
  // Due at the end of the quarter start month
  const [year, q] = period.split("-Q");
  const startMonth = (parseInt(q) - 1) * 3; // 0,3,6,9
  return addMonths(new Date(parseInt(year), startMonth, 1), 3); // due at quarter end
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ORG_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId!;
  const { searchParams } = req.nextUrl;
  const period = searchParams.get("period") ?? currentBillingPeriod();

  const payments = await prisma.clientPayment.findMany({
    where: { organizationId: orgId, billingPeriod: period },
    include: { client: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: payments, period });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ORG_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId!;
  const body = await req.json().catch(() => ({}));
  const period: string = body.period ?? currentBillingPeriod();

  // Get all active clients with a quarterly fee set
  const clients = await prisma.clientProfile.findMany({
    where: {
      user: { organizationId: orgId, isActive: true, role: "CLIENT" },
      quarterlyFee: { not: null, gt: 0 },
    },
    include: { user: { select: { id: true, name: true } } },
  });

  if (clients.length === 0) {
    return NextResponse.json(
      { error: "No active clients with a quarterly fee set. Set a quarterly fee on each client first." },
      { status: 400 }
    );
  }

  // Check which clients already have an invoice for this period
  const existing = await prisma.clientPayment.findMany({
    where: { organizationId: orgId, billingPeriod: period },
    select: { clientId: true },
  });
  const alreadyInvoiced = new Set(existing.map((p) => p.clientId));

  const toCreate = clients.filter((c) => !alreadyInvoiced.has(c.userId));

  if (toCreate.length === 0) {
    return NextResponse.json(
      { error: `All clients are already invoiced for ${period}.` },
      { status: 409 }
    );
  }

  const dueDate = quarterDueDate(period);

  await prisma.clientPayment.createMany({
    data: toCreate.map((c) => ({
      clientId: c.userId,
      organizationId: orgId,
      amount: c.quarterlyFee!,
      billingPeriod: period,
      dueDate: startOfDay(dueDate),
      status: "PENDING",
    })),
  });

  return NextResponse.json(
    { message: `Generated ${toCreate.length} invoice(s) for ${period}.` },
    { status: 201 }
  );
}
