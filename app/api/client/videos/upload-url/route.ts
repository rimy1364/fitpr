import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPresignedUploadUrl, getS3Url, buildVideoKey } from "@/lib/s3";
import { videoUploadSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = videoUploadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { exerciseName, description, fileName, fileType } = parsed.data;
  const orgId = session.user.organizationId!;

  const key = buildVideoKey(orgId, session.user.id, fileName);
  const uploadUrl = await getPresignedUploadUrl(key, fileType);
  const s3Url = getS3Url(key);

  // Get client's trainer
  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  // Pre-create the DB record (will be confirmed after upload)
  const video = await prisma.formVideo.create({
    data: {
      clientId: session.user.id,
      trainerId: clientProfile?.assignedTrainerId ?? null,
      s3Url,
      exerciseName,
      description,
      status: "PENDING",
    },
  });

  // Notify trainer
  if (clientProfile?.assignedTrainerId) {
    const notification = await prisma.notification.create({
      data: {
        userId: clientProfile.assignedTrainerId,
        type: "VIDEO_UPLOADED",
        title: "New Form Video",
        body: `${session.user.name} uploaded a ${exerciseName} form video`,
        relatedId: video.id,
      },
    });

    const { triggerNotification } = await import("@/lib/pusher");
    await triggerNotification(clientProfile.assignedTrainerId, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      createdAt: notification.createdAt,
    }).catch(console.error);
  }

  return NextResponse.json({ uploadUrl, videoId: video.id, s3Url });
}
