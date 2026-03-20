import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, getTodaysWorkout } from "@/lib/utils";
import { Exercise } from "@/types";
import { Dumbbell } from "lucide-react";

export const metadata = { title: "My Program" };

export default async function ClientProgramPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const program = await prisma.workoutProgram.findFirst({
    where: { clientId: userId, isActive: true },
    include: {
      days: { orderBy: { dayNumber: "asc" } },
      trainer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!program) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">My Program</h1>
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No active workout program assigned yet.</p>
            <p className="text-sm mt-1">Your trainer will assign one soon.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const todaysWorkout = getTodaysWorkout(
    program.days.map((d) => ({
      dayNumber: d.dayNumber,
      title: d.title,
      exercises: d.exercises as unknown as Exercise[],
    })),
    program.startDate
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{program.title}</h1>
        <p className="text-muted-foreground">
          By {program.trainer.name} · {formatDate(program.startDate)}
          {program.endDate && ` → ${formatDate(program.endDate)}`}
        </p>
        {program.description && <p className="text-sm mt-1">{program.description}</p>}
      </div>

      {todaysWorkout && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge>Today</Badge>
              Day {todaysWorkout.dayNumber}: {todaysWorkout.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(todaysWorkout.exercises as unknown as Exercise[]).map((ex, i) => (
                <ExerciseRow key={i} exercise={ex} index={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {program.days.map((day) => {
          const isToday = todaysWorkout?.dayNumber === day.dayNumber;
          return (
            <Card key={day.id} className={isToday ? "border-primary" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {isToday && <Badge className="text-xs">Today</Badge>}
                  Day {day.dayNumber}: {day.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(day.exercises as unknown as Exercise[]).map((ex, i) => (
                    <ExerciseRow key={i} exercise={ex} index={i} compact />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ExerciseRow({ exercise, index, compact = false }: { exercise: Exercise; index: number; compact?: boolean }) {
  return (
    <div className={`flex items-start justify-between ${compact ? "text-sm" : ""} border-b last:border-0 pb-2 last:pb-0`}>
      <div className="flex-1">
        <span className="text-muted-foreground mr-2">{index + 1}.</span>
        <span className="font-medium">{exercise.name}</span>
        {!compact && exercise.notes && (
          <p className="text-xs text-muted-foreground mt-0.5 ml-5">{exercise.notes}</p>
        )}
      </div>
      <div className="text-right ml-4 shrink-0">
        <span className="font-medium">{exercise.sets}×{exercise.reps}</span>
        {exercise.rest > 0 && (
          <p className="text-xs text-muted-foreground">{exercise.rest}s rest</p>
        )}
      </div>
    </div>
  );
}
