import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getStreakFromCheckIns, getTodaysWorkout, formatDate } from "@/lib/utils";
import { Flame, ClipboardList, Dumbbell } from "lucide-react";
import { Exercise } from "@/types";

export const metadata = { title: "Dashboard" };

export default async function ClientDashboard() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [user, checkIns, activeProgram] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { clientProfile: true },
    }),
    prisma.checkIn.findMany({
      where: { clientId: userId },
      orderBy: { date: "desc" },
      take: 90,
      select: { date: true, id: true },
    }),
    prisma.workoutProgram.findFirst({
      where: { clientId: userId, isActive: true },
      include: { days: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const streak = getStreakFromCheckIns(checkIns.map((c) => ({ date: c.date })));
  const todayCheckedIn = checkIns.some(
    (c) => new Date(c.date).toDateString() === new Date().toDateString()
  );

  const todaysWorkout = activeProgram
    ? getTodaysWorkout(
        activeProgram.days.map((d) => ({
          dayNumber: d.dayNumber,
          title: d.title,
          exercises: d.exercises as unknown as Exercise[],
        })),
        activeProgram.startDate
      )
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Good day, {session?.user.name?.split(" ")[0]}!</h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className={streak > 0 ? "border-orange-200 dark:border-orange-800" : ""}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{streak}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
          </CardContent>
        </Card>

        <Card className={todayCheckedIn ? "border-green-200 dark:border-green-800" : "border-yellow-200 dark:border-yellow-800"}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <p className="font-medium">Today's Check-In</p>
            </div>
            {todayCheckedIn ? (
              <Badge variant="success">Completed ✓</Badge>
            ) : (
              <Button size="sm" asChild>
                <Link href="/client/checkin">Log Check-In</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="h-5 w-5 text-muted-foreground" />
              <p className="font-medium">Today's Workout</p>
            </div>
            {todaysWorkout ? (
              <div>
                <p className="text-sm font-medium">{todaysWorkout.title}</p>
                <p className="text-xs text-muted-foreground">{(todaysWorkout.exercises as unknown as Exercise[]).length} exercises</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No program assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      {todaysWorkout && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today's Workout — {todaysWorkout.title}</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/client/program">Full Program</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(todaysWorkout.exercises as unknown as Exercise[]).map((ex, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{ex.name}</p>
                    {ex.notes && <p className="text-xs text-muted-foreground">{ex.notes}</p>}
                  </div>
                  <div className="text-right text-sm">
                    <p>{ex.sets} × {ex.reps}</p>
                    {ex.rest > 0 && <p className="text-xs text-muted-foreground">{ex.rest}s rest</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
