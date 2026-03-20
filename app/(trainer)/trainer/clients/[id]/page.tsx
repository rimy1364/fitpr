import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import Link from "next/link";
import { formatDate, formatGoal, getStreakFromCheckIns } from "@/lib/utils";
import { CheckInTimeline } from "@/components/trainer/CheckInTimeline";

export default async function TrainerClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const trainerId = session!.user.id;
  const { id } = await params;

  const client = await prisma.user.findUnique({
    where: { id },
    include: {
      clientProfile: true,
      clientCheckIns: {
        orderBy: { date: "desc" },
        take: 30,
        include: { trainer: { select: { name: true } } },
      },
      clientVideos: {
        orderBy: { uploadedAt: "desc" },
        take: 10,
      },
      clientPrograms: {
        where: { isActive: true },
        include: { days: true },
        take: 1,
      },
    },
  });

  if (!client || client.role !== "CLIENT") notFound();

  // Verify this client belongs to the trainer
  if (client.clientProfile?.assignedTrainerId !== trainerId) notFound();

  const streak = getStreakFromCheckIns(client.clientCheckIns.map((c) => ({ date: c.date })));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">{client.email}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/trainer/clients/${client.id}/checkin`}>Log Check-In</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/trainer/clients/${client.id}/program`}>Manage Program</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Status</p>
          <StatusBadge status={client.clientProfile?.status ?? "ACTIVE"} className="mt-1" />
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Goal</p>
          <p className="font-medium mt-1">{client.clientProfile?.goal ? formatGoal(client.clientProfile.goal) : "—"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Current Weight</p>
          <p className="font-medium mt-1">{client.clientProfile?.currentWeight ?? "—"} {client.clientProfile?.currentWeight ? "kg" : ""}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Check-in Streak</p>
          <p className="font-medium mt-1">🔥 {streak} days</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="checkins">
        <TabsList>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="videos">Videos ({client.clientVideos.length})</TabsTrigger>
          <TabsTrigger value="program">Program</TabsTrigger>
        </TabsList>

        <TabsContent value="checkins" className="mt-4">
          <CheckInTimeline checkIns={client.clientCheckIns} clientId={client.id} />
        </TabsContent>

        <TabsContent value="videos" className="mt-4">
          <div className="space-y-3">
            {client.clientVideos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No videos uploaded yet.</p>
            ) : (
              client.clientVideos.map((video) => (
                <Card key={video.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{video.exerciseName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(video.uploadedAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={video.status} />
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/trainer/clients/${client.id}/videos`}>Review</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="program" className="mt-4">
          {client.clientPrograms.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">No active program assigned.</p>
                <Button asChild>
                  <Link href="/trainer/programs/new">Create Program</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{client.clientPrograms[0].title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{client.clientPrograms[0].description}</p>
                <p className="text-sm mt-2">
                  {formatDate(client.clientPrograms[0].startDate)} →{" "}
                  {client.clientPrograms[0].endDate ? formatDate(client.clientPrograms[0].endDate) : "Ongoing"}
                </p>
                <p className="text-sm mt-1">{client.clientPrograms[0].days.length} days</p>
                <Button className="mt-4" size="sm" asChild>
                  <Link href={`/trainer/clients/${client.id}/program`}>View / Edit Program</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
