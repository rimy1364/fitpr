import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, IndianRupee, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { OrgTable } from "@/components/superadmin/OrgTable";

export const metadata = { title: "Super Admin Dashboard" };

export default async function SuperAdminDashboard() {
  const [
    totalOrgs,
    activeOrgs,
    trialOrgs,
    totalTrainers,
    totalClients,
    recentPayments,
    recentOrgs,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { status: "ACTIVE" } }),
    prisma.organization.count({ where: { status: "TRIAL" } }),
    prisma.user.count({ where: { role: "TRAINER" } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.clientPayment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.organization.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { users: true } } },
    }),
  ]);

  const stats = [
    {
      title: "Total Accounts",
      value: totalOrgs,
      sub: `${activeOrgs} active, ${trialOrgs} trial`,
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Total Trainers",
      value: totalTrainers,
      sub: "Across all orgs",
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Total Clients",
      value: totalClients,
      sub: "Across all orgs",
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(recentPayments._sum.amount ?? 0),
      sub: "All time (client payments)",
      icon: IndianRupee,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Overview</h1>
        <p className="text-muted-foreground">Welcome back, Super Admin.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OrgTable orgs={recentOrgs} />
        </CardContent>
      </Card>
    </div>
  );
}
