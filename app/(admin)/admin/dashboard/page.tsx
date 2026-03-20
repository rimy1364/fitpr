import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users, UserCheck, DollarSign, TrendingUp } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const orgId = session!.user.organizationId!;

  const [totalTrainers, totalClients, activeClients, recentPayments, recentClients, org] = await Promise.all([
    prisma.user.count({ where: { organizationId: orgId, role: "TRAINER", isActive: true } }),
    prisma.user.count({ where: { organizationId: orgId, role: "CLIENT" } }),
    prisma.clientProfile.count({ where: { user: { organizationId: orgId }, status: "ACTIVE" } }),
    prisma.clientPayment.aggregate({
      where: { organizationId: orgId, status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.user.findMany({
      where: { organizationId: orgId, role: "CLIENT" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { clientProfile: { select: { status: true, goal: true, assignedTrainerId: true } } },
    }),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, maxTrainers: true, maxClients: true, subscriptionPlan: true, status: true },
    }),
  ]);

  const stats = [
    { title: "Total Trainers", value: totalTrainers, sub: `of ${org?.maxTrainers === -1 ? "∞" : org?.maxTrainers} max`, icon: UserCheck, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
    { title: "Total Clients", value: totalClients, sub: `${activeClients} active`, icon: Users, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
    { title: "Total Revenue", value: formatCurrency(recentPayments._sum.amount ?? 0), sub: "All time", icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950" },
    { title: "Plan", value: org?.subscriptionPlan ?? "—", sub: <StatusBadge status={org?.status ?? "ACTIVE"} />, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{org?.name} Dashboard</h1>
        <p className="text-muted-foreground">Overview of your organization.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{s.title}</p>
                  <p className="mt-1 text-2xl font-bold">{s.value}</p>
                  <div className="mt-1 text-xs text-muted-foreground">{s.sub}</div>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${s.bg}`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Clients</CardTitle></CardHeader>
        <CardContent>
          {recentClients.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No clients yet. Add your first client!</p>
          ) : (
            <div className="space-y-3">
              {recentClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {client.clientProfile?.goal && (
                      <span className="text-xs text-muted-foreground">
                        {client.clientProfile.goal.replace("_", " ")}
                      </span>
                    )}
                    <StatusBadge status={client.clientProfile?.status ?? "ACTIVE"} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
