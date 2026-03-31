import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  perClientFee: z.number().int().min(0).nullable().optional(),
});

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ORG_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const orgId = session.user.organizationId!;

  const trainer = await prisma.user.findUnique({
    where: { id, organizationId: orgId, role: "TRAINER" },
  });
  if (!trainer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  if (parsed.data.perClientFee !== undefined) {
    await prisma.trainerProfile.update({
      where: { userId: id },
      data: { perClientFee: parsed.data.perClientFee },
    });
  }

  return NextResponse.json({ success: true });
}
