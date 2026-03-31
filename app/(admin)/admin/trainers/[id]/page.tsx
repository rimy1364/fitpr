import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Mail, Phone, Calendar, Users, IndianRupee } from "lucide-react";
import Link from "next/link";
import { TrainerFeeForm } from "./trainer-fee-form";

export const metadata = { title: "Trainer Details" };

interface Props { params: Promise<{ id: string }> }

export default async function TrainerDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const orgId = session!.user.organizationId!;

  const trainer = await prisma.user.findUnique({
    where: { id, organizationId: orgId, role: "TRAINER" },
    include: { trainerProfile: true },
  });

  if (!trainer) notFound();

  const clients = await prisma.clientProfile.findMany({
    where: { assignedTrainerId: id, user: { organizationId: orgId } },
    include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
    orderBy: { user: { name: "asc" } },
  });

  const calculatedSalary =
    trainer.trainerProfile?.perClientFee != null
      ? clients.length * trainer.trainerProfile.perClientFee
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{trainer.name}</h1>
          <p className="text-muted-foreground">{trainer.email}</p>
        </div>
        <Badge variant={trainer.isActive ? "success" : "secondary"} className="text-sm px-3 py-1">
          {trainer.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Assigned Clients", value: clients.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
          { label: "Per Client Fee", value: (
            <div>
              <span>{trainer.trainerProfile?.perClientFee ? formatCurrency(trainer.trainerProfile.perClientFee) : "Not set"}</span>
              <TrainerFeeForm trainerId={trainer.id} currentFee={trainer.trainerProfile?.perClientFee ?? null} />
            </div>
          ), icon: IndianRupee, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950" },
          { label: "Monthly Salary", value: calculatedSalary != null ? formatCurrency(calculatedSalary) : "—", icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="mt-1 font-bold text-xl">{s.value}</p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" /> {trainer.email}
            </div>
            {trainer.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" /> {trainer.phone}
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" /> Joined {formatDate(trainer.createdAt)}
            </div>
            {trainer.trainerProfile?.bio && (
              <p className="text-muted-foreground pt-2 border-t">{trainer.trainerProfile.bio}</p>
            )}
            {(trainer.trainerProfile?.specializations?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {trainer.trainerProfile!.specializations.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Assigned Clients ({clients.length})</CardTitle></CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No clients assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {clients.map((c) => (
                  <Link
                    key={c.userId}
                    href={`/admin/clients/${c.userId}`}
                    className="flex items-center justify-between text-sm py-2 px-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{c.user.name}</p>
                      <p className="text-xs text-muted-foreground">{c.user.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(c.user.createdAt)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
