import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Users, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Trainers" };

export default async function TrainersPage() {
  const session = await getServerSession(authOptions);
  const orgId = session!.user.organizationId!;

  const [trainers, org] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: orgId, role: "TRAINER" },
      include: {
        trainerProfile: true,
        _count: {
          select: {
            clientPrograms: { where: { isActive: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { maxTrainers: true },
    }),
  ]);

  const clientsPerTrainer = await prisma.clientProfile.groupBy({
    by: ["assignedTrainerId"],
    where: { user: { organizationId: orgId } },
    _count: true,
  });
  const clientCountMap: Record<string, number> = {};
  clientsPerTrainer.forEach((r) => {
    if (r.assignedTrainerId) clientCountMap[r.assignedTrainerId] = r._count;
  });

  const canAdd = org?.maxTrainers === -1 || trainers.length < (org?.maxTrainers ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trainers</h1>
          <p className="text-muted-foreground">
            {trainers.length} of {org?.maxTrainers === -1 ? "unlimited" : org?.maxTrainers} trainers
          </p>
        </div>
        {canAdd ? (
          <Button asChild>
            <Link href="/admin/trainers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Trainer
            </Link>
          </Button>
        ) : (
          <Button disabled variant="outline" className="gap-2 cursor-not-allowed">
            <Plus className="h-4 w-4" />
            Add Trainer
          </Button>
        )}
      </div>

      {!canAdd && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-700 p-4">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-300">Trainer limit reached</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              Your <strong>{org?.maxTrainers}</strong>-trainer limit on the current plan has been reached.
              To add more trainers, please upgrade your plan. Contact your FitPR account manager to upgrade.
            </p>
          </div>
        </div>
      )}

      {trainers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No trainers yet. Add your first trainer!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trainers.map((trainer) => (
            <Card key={trainer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{trainer.name}</h3>
                    <p className="text-sm text-muted-foreground">{trainer.email}</p>
                  </div>
                  <Badge variant={trainer.isActive ? "success" : "secondary"}>
                    {trainer.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {(trainer.trainerProfile?.specializations?.length ?? 0) > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {trainer.trainerProfile!.specializations.slice(0, 3).map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {clientCountMap[trainer.id] ?? 0} clients
                  </span>
                  {trainer.trainerProfile?.perClientFee != null && (
                    <span className="font-medium text-foreground">
                      ₹{((clientCountMap[trainer.id] ?? 0) * trainer.trainerProfile.perClientFee).toLocaleString("en-IN")}/mo
                    </span>
                  )}
                </div>

                <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                  <Link href={`/admin/trainers/${trainer.id}`}>View Profile</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
