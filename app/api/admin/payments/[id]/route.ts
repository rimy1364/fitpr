import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ORG_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const payment = await prisma.clientPayment.findUnique({ where: { id } });
  if (!payment || payment.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { status, notes } = body;

  const updated = await prisma.clientPayment.update({
    where: { id },
    data: {
      status: status ?? payment.status,
      notes: notes ?? payment.notes,
      paidAt: status === "PAID" ? new Date() : payment.paidAt,
    },
  });

  return NextResponse.json({ data: updated });
}
