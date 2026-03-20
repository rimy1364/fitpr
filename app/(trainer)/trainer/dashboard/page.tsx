import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Users, Video, ClipboardList } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Trainer Dashboard" };

export default async function TrainerDashboard() {
  const session = await getServerSession(authOptions);
  const trainerId = session!.user.id;

  const [myClients, pendingVideos, todaysCheckIns] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CLIENT", clientProfile: { assignedTrainerId: trainerId } },
      include: { clientProfile: { select: { goal: true, status: true, currentWeight: true } } },
      orderBy: { name: "asc" },
      take: 5,
    }),
    prisma.formVideo.findMany({
      where: { trainerId, status: "PENDING" },
      include: { client: { select: { name: true } } },
      orderBy: { uploadedAt: "desc" },
      take: 5,
    }),
    prisma.checkIn.count({
      where: {
        trainerId,
        date: new Date(new Date().toDateString()),
      },
    }),
  ]);

  const totalClients = await prisma.clientProfile.count({ where: { assignedTrainerId: trainerId } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {session?.user.name}!</h1>
        <p className="text-muted-foreground">Here's what needs your attention today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalClients}</p>
              <p className="text-sm text-muted-foreground">Active Clients</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950">
              <Video className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingVideos.length}</p>
              <p className="text-sm text-muted-foreground">Videos to Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
              <ClipboardList className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todaysCheckIns}</p>
              <p className="text-sm text-muted-foreground">Check-ins Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Clients</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/trainer/clients">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {myClients.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No clients assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {myClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {client.clientProfile?.goal?.replace("_", " ") ?? "No goal set"}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/trainer/clients/${client.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Pending Video Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingVideos.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No pending videos.</p>
            ) : (
              <div className="space-y-3">
                {pendingVideos.map((video) => (
                  <div key={video.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{video.exerciseName}</p>
                      <p className="text-xs text-muted-foreground">
                        {video.client.name} · {formatDate(video.uploadedAt)}
                      </p>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
