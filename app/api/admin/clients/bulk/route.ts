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
  quarterlyFee: z.coerce.number().int().min(0).optional(),
  goal: z.enum(["WEIGHT_LOSS", "MUSCLE_GAIN", "TRANSFORMATION", "FITNESS"]).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ORG_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId!;
  const body = await req.json();
  const { rows } = body as { rows: Record<string, string>[] };

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 });
  }

  const results: { name: string; status: "created" | "skipped"; reason?: string }[] = [];

  for (const row of rows) {
    const parsed = rowSchema.safeParse(row);
    if (!parsed.success) {
      results.push({ name: row.name ?? row.email ?? "?", status: "skipped", reason: parsed.error.issues[0].message });
      continue;
    }

    const { name, email, password, phone, quarterlyFee, goal } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      results.push({ name, status: "skipped", reason: "Email already exists" });
      continue;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, phone: phone || null, password: hashedPassword, role: "CLIENT", organizationId: orgId, isActive: true },
    });
    await prisma.clientProfile.create({
      data: { userId: user.id, goal: goal ?? null, quarterlyFee: quarterlyFee ?? null },
    });
    results.push({ name, status: "created" });
  }

  const created = results.filter((r) => r.status === "created").length;
  const skipped = results.filter((r) => r.status === "skipped").length;

  return NextResponse.json({ results, summary: { created, skipped } }, { status: 201 });
}
