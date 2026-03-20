import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkInSchema } from "@/lib/validations";
import { triggerNotification } from "@/lib/pusher";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checkIns = await prisma.checkIn.findMany({
    where: { clientId: session.user.id },
    orderBy: { date: "desc" },
    take: 90,
    include: { trainer: { select: { name: true } } },
  });

  return NextResponse.json({ data: checkIns });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = checkInSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Enforce one check-in per day
  const existing = await prisma.checkIn.findFirst({
    where: { clientId: session.user.id, date: today },
  });

  if (existing) {
    return NextResponse.json({ error: "You have already checked in today" }, { status: 409 });
  }

  // Get trainer ID for the client
  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  const checkIn = await prisma.checkIn.create({
    data: {
      clientId: session.user.id,
      trainerId: clientProfile?.assignedTrainerId ?? null,
      date: today,
      ...parsed.data,
    },
  });

  // Update client's current weight
  if (parsed.data.weight && clientProfile) {
    await prisma.clientProfile.update({
      where: { userId: session.user.id },
      data: { currentWeight: parsed.data.weight },
    });
  }

  // Notify trainer
  if (clientProfile?.assignedTrainerId) {
    const notification = await prisma.notification.create({
      data: {
        userId: clientProfile.assignedTrainerId,
        type: "CHECKIN_SUBMITTED",
        title: "New Check-In",
        body: `${session.user.name} submitted their daily check-in`,
        relatedId: checkIn.id,
      },
    });

    await triggerNotification(clientProfile.assignedTrainerId, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      createdAt: notification.createdAt,
    }).catch(console.error);
  }

  return NextResponse.json({ data: checkIn }, { status: 201 });
}
