import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProgressCharts } from "@/components/client/ProgressChart";

export const metadata = { title: "Progress" };

export default async function ProgressPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [checkIns, measurements, clientProfile] = await Promise.all([
    prisma.checkIn.findMany({
      where: { clientId: userId, weight: { not: null } },
      orderBy: { date: "asc" },
      select: { date: true, weight: true },
    }),
    prisma.progressMeasurement.findMany({
      where: { clientId: userId },
      orderBy: { date: "asc" },
    }),
    prisma.clientProfile.findUnique({
      where: { userId },
      select: { startWeight: true, targetWeight: true, goal: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Progress</h1>
        <p className="text-muted-foreground">Track your fitness journey over time.</p>
      </div>
      <ProgressCharts
        checkIns={checkIns.map((c) => ({ date: c.date.toISOString(), weight: c.weight! }))}
        measurements={measurements}
        startWeight={clientProfile?.startWeight ?? null}
        targetWeight={clientProfile?.targetWeight ?? null}
      />
    </div>
  );
}
