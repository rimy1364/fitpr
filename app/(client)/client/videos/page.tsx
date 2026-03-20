import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VideoUploader } from "@/components/client/VideoUploader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import { Video } from "lucide-react";

export const metadata = { title: "Form Videos" };

export default async function ClientVideosPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const videos = await prisma.formVideo.findMany({
    where: { clientId: userId },
    orderBy: { uploadedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Form Videos</h1>
        <p className="text-muted-foreground">Upload exercise videos for trainer feedback.</p>
      </div>

      <VideoUploader />

      <div className="space-y-3">
        {videos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No videos uploaded yet.</p>
            </CardContent>
          </Card>
        ) : (
          videos.map((video) => (
            <Card key={video.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{video.exerciseName}</p>
                      <StatusBadge status={video.status} />
                    </div>
                    {video.description && (
                      <p className="text-sm text-muted-foreground mb-2">{video.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Uploaded {formatDate(video.uploadedAt)}
                    </p>
                    {video.status === "REVIEWED" && video.trainerFeedback && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded-md">
                        <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                          Trainer Feedback:
                        </p>
                        <p className="text-sm">{video.trainerFeedback}</p>
                        {video.feedbackAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(video.feedbackAt)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
