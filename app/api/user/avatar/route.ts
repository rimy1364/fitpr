import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { avatar } = body;

  if (!avatar || typeof avatar !== "string") {
    return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
  }

  // Enforce max size — base64 of ~300KB original = ~400KB string
  if (avatar.length > 500_000) {
    return NextResponse.json({ error: "Image too large. Max 300KB." }, { status: 400 });
  }

  if (!avatar.startsWith("data:image/")) {
    return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatar },
  });

  return NextResponse.json({ avatar });
}
