import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TRAINER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { trainerNotes } = await req.json();

  const checkIn = await prisma.checkIn.findUnique({ where: { id } });
  if (!checkIn || checkIn.trainerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.checkIn.update({
    where: { id },
    data: { trainerNotes },
  });

  return NextResponse.json({ data: updated });
}
