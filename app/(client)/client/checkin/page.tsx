import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CheckInForm } from "@/components/client/CheckInWidget";

export const metadata = { title: "Daily Check-In" };

export default async function CheckInPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  // Check if already checked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingCheckIn = await prisma.checkIn.findFirst({
    where: { clientId: userId, date: today },
  });

  const recentCheckIns = await prisma.checkIn.findMany({
    where: { clientId: userId },
    orderBy: { date: "desc" },
    take: 7,
  });

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Daily Check-In</h1>
        <p className="text-muted-foreground">How are you doing today?</p>
      </div>
      <CheckInForm existingCheckIn={existingCheckIn} recentCheckIns={recentCheckIns} />
    </div>
  );
}
