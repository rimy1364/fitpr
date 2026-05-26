import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const rowSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional().default(""),
  perClientFee: z.coerce.number().int().min(0).optional(),
  bio: z.string().optional().default(""),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ORG_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId!;
  const [org, currentCount] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { maxTrainers: true } }),
    prisma.user.count({ where: { organizationId: orgId, role: "TRAINER", isActive: true } }),
  ]);

  const body = await req.json();
  const { rows } = body as { rows: Record<string, string>[] };

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 });
  }

  const results: { name: string; status: "created" | "skipped"; reason?: string }[] = [];
  let addedCount = 0;

  for (const row of rows) {
    // Check plan limit dynamically
    if (org && org.maxTrainers !== -1 && currentCount + addedCount >= org.maxTrainers) {
      results.push({ name: row.name ?? row.email ?? "?", status: "skipped", reason: "Trainer limit reached" });
      continue;
    }

    const parsed = rowSchema.safeParse(row);
    if (!parsed.success) {
      results.push({ name: row.name ?? row.email ?? "?", status: "skipped", reason: parsed.error.issues[0].message });
      continue;
    }

    const { name, email, password, phone, perClientFee, bio } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      results.push({ name, status: "skipped", reason: "Email already exists" });
      continue;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, phone: phone || null, password: hashedPassword, role: "TRAINER", organizationId: orgId, isActive: true },
    });
    await prisma.trainerProfile.create({
      data: { userId: user.id, bio: bio || null, specializations: [], perClientFee: perClientFee ?? null },
    });

    results.push({ name, status: "created" });
    addedCount++;
  }

  return NextResponse.json({
    results,
    summary: { created: addedCount, skipped: results.length - addedCount },
  }, { status: 201 });
}
