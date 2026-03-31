import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate, formatGoal } from "@/lib/utils";
import { Mail, Phone, Calendar, UserCheck, Target, IndianRupee, CreditCard, Activity } from "lucide-react";
import { ClientDetailActions } from "./client-detail-actions";

export const metadata = { title: "Client Details" };

interface Props { params: Promise<{ id: string }> }

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const orgId = session!.user.organizationId!;

  const [client, trainers] = await Promise.all([
    prisma.user.findUnique({
      where: { id, organizationId: orgId, role: "CLIENT" },
      include: {
        clientProfile: true,
        clientPayments: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        clientCheckIns: {
          orderBy: { date: "desc" },
          take: 5,
        },
      },
    }),
    prisma.user.findMany({
      where: { organizationId: orgId, role: "TRAINER", isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!client) notFound();

  const profile = client.clientProfile;
  const assignedTrainer = profile?.assignedTrainerId
    ? trainers.find((t) => t.id === profile.assignedTrainerId)
    : null;

  const totalPaid = client.clientPayments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0);

  const pendingPayments = client.clientPayments.filter((p) => p.status === "PENDING");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">{client.email}</p>
        </div>
        <ClientDetailActions
          clientId={client.id}
          profile={profile}
          trainers={trainers}
        />
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Status", value: <StatusBadge status={profile?.status ?? "ACTIVE"} />, icon: Activity, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
          { label: "Trainer", value: assignedTrainer?.name ?? "Unassigned", icon: UserCheck, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
          { label: "Quarterly Fee", value: profile?.quarterlyFee ? formatCurrency(profile.quarterlyFee) : "Not set", icon: IndianRupee, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950" },
          { label: "Total Paid", value: formatCurrency(totalPaid), icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <div className="mt-1 font-semibold">{s.value}</div>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile info */}
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {client.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                {client.phone}
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              {client.email}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Joined {formatDate(client.createdAt)}
            </div>
            {profile?.goal && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                Goal: {formatGoal(profile.goal)}
              </div>
            )}
            {profile && (
              <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t">
                {[
                  { label: "Start Weight", value: profile.startWeight ? `${profile.startWeight} kg` : "—" },
                  { label: "Current Weight", value: profile.currentWeight ? `${profile.currentWeight} kg` : "—" },
                  { label: "Target Weight", value: profile.targetWeight ? `${profile.targetWeight} kg` : "—" },
                  { label: "Height", value: profile.height ? `${profile.height} cm` : "—" },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-xs text-muted-foreground">{f.label}</p>
                    <p className="font-medium">{f.value}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent check-ins */}
        <Card>
          <CardHeader><CardTitle>Recent Check-ins</CardTitle></CardHeader>
          <CardContent>
            {client.clientCheckIns.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No check-ins yet.</p>
            ) : (
              <div className="space-y-3">
                {client.clientCheckIns.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2">
                    <span className="text-muted-foreground">{formatDate(c.date)}</span>
                    <div className="flex items-center gap-3">
                      {c.weight && <span>{c.weight} kg</span>}
                      {c.energyLevel && (
                        <Badge variant="outline" className="text-xs">Energy {c.energyLevel}/10</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment History</CardTitle>
            {pendingPayments.length > 0 && (
              <Badge className="bg-amber-100 text-amber-800 border-0">
                {pendingPayments.length} pending
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {client.clientPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-2 text-left font-medium">Period</th>
                    <th className="pb-2 text-left font-medium">Amount</th>
                    <th className="pb-2 text-left font-medium">Due</th>
                    <th className="pb-2 text-left font-medium">Status</th>
                    <th className="pb-2 text-left font-medium">Paid On</th>
                  </tr>
                </thead>
                <tbody>
                  {client.clientPayments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{p.billingPeriod ?? p.planName ?? "—"}</td>
                      <td className="py-2 pr-4 font-medium">{formatCurrency(p.amount)}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{p.dueDate ? formatDate(p.dueDate) : "—"}</td>
                      <td className="py-2 pr-4"><StatusBadge status={p.status} /></td>
                      <td className="py-2 text-muted-foreground">{p.paidAt ? formatDate(p.paidAt) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
