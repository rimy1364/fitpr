import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateClientSchema = z.object({
  assignedTrainerId: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "INACTIVE"]).optional(),
  quarterlyFee: z.number().int().min(0).nullable().optional(),
});

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ORG_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const orgId = session.user.organizationId!;

  const client = await prisma.user.findUnique({
    where: { id, organizationId: orgId, role: "CLIENT" },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { assignedTrainerId, status, quarterlyFee } = parsed.data;

  await prisma.clientProfile.update({
    where: { userId: id },
    data: {
      ...(assignedTrainerId !== undefined && { assignedTrainerId }),
      ...(status !== undefined && { status }),
      ...(quarterlyFee !== undefined && { quarterlyFee }),
    },
  });

  return NextResponse.json({ success: true });
}
