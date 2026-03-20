import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { onboardingStep1Schema, onboardingStep2Schema } from "@/lib/validations";

const onboardingSchema = onboardingStep1Schema.merge(onboardingStep2Schema);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = onboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, phone, goal, startWeight, targetWeight, height } = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, phone: phone ?? null, isActive: true },
  });

  await prisma.clientProfile.upsert({
    where: { userId: session.user.id },
    update: { goal, startWeight, currentWeight: startWeight, targetWeight, height, startDate: new Date() },
    create: {
      userId: session.user.id,
      goal,
      startWeight,
      currentWeight: startWeight,
      targetWeight,
      height,
      startDate: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
