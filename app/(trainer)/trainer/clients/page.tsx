import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatGoal } from "@/lib/utils";

export const metadata = { title: "My Clients" };

export default async function TrainerClientsPage() {
  const session = await getServerSession(authOptions);
  const trainerId = session!.user.id;

  const clients = await prisma.user.findMany({
    where: { role: "CLIENT", clientProfile: { assignedTrainerId: trainerId } },
    include: {
      clientProfile: true,
      _count: { select: { clientCheckIns: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Clients</h1>
        <p className="text-muted-foreground">{clients.length} clients assigned to you</p>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No clients assigned yet. Contact your admin.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                  <Badge variant={client.clientProfile?.status === "ACTIVE" ? "success" : "secondary"}>
                    {client.clientProfile?.status ?? "ACTIVE"}
                  </Badge>
                </div>

                {client.clientProfile?.goal && (
                  <p className="text-sm text-muted-foreground mb-3">
                    Goal: {formatGoal(client.clientProfile.goal)}
                  </p>
                )}

                {client.clientProfile?.currentWeight && (
                  <p className="text-sm text-muted-foreground mb-3">
                    Weight: {client.clientProfile.currentWeight} kg
                    {client.clientProfile.targetWeight && ` → ${client.clientProfile.targetWeight} kg`}
                  </p>
                )}

                <p className="text-xs text-muted-foreground mb-4">
                  {client._count.clientCheckIns} check-ins logged
                </p>

                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/trainer/clients/${client.id}`}>View Client</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
