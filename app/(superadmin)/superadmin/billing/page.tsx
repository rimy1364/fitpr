import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, TrendingUp, Building2, CreditCard } from "lucide-react";

export const metadata = { title: "Billing Overview" };

export default async function BillingPage() {
  const [
    totalRevenue,
    monthRevenue,
    recentPayments,
    orgsByPlan,
    totalOrgs,
  ] = await Promise.all([
    // All-time platform revenue
    prisma.clientPayment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    // This month's revenue
    prisma.clientPayment.aggregate({
      where: {
        status: "PAID",
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { amount: true },
    }),
    // Last 20 payments
    prisma.clientPayment.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        organization: { select: { name: true } },
      },
    }),
    // Orgs grouped by plan
    prisma.organization.groupBy({
      by: ["subscriptionPlan", "status"],
      _count: true,
      where: { status: { in: ["ACTIVE", "TRIAL"] } },
    }),
    // Total active/trial orgs
    prisma.organization.count({
      where: { status: { in: ["ACTIVE", "TRIAL"] } },
    }),
  ]);

  // Build plan summary
  const planMap: Record<string, { active: number; trial: number }> = {
    STARTER: { active: 0, trial: 0 },
    GROWTH: { active: 0, trial: 0 },
    PRO: { active: 0, trial: 0 },
  };
  orgsByPlan.forEach((row) => {
    if (!planMap[row.subscriptionPlan]) return;
    if (row.status === "ACTIVE") planMap[row.subscriptionPlan].active = row._count;
    if (row.status === "TRIAL") planMap[row.subscriptionPlan].trial = row._count;
  });

  const platformPlans = await prisma.platformPlan.findMany({ orderBy: { price: "asc" } });
  const planPriceMap: Record<string, number> = {};
  platformPlans.forEach((p) => { planPriceMap[p.name] = p.price; });

  // Estimated MRR from active orgs
  const estimatedMRR = Object.entries(planMap).reduce((sum, [name, counts]) => {
    return sum + (planPriceMap[name] ?? 0) * counts.active;
  }, 0);

  const stats = [
    {
      label: "All-time Revenue",
      value: formatCurrency(totalRevenue._sum.amount ?? 0),
      icon: DollarSign,
      sub: "From client payments",
    },
    {
      label: "This Month",
      value: formatCurrency(monthRevenue._sum.amount ?? 0),
      icon: TrendingUp,
      sub: "Client payments in " + new Date().toLocaleString("default", { month: "long" }),
    },
    {
      label: "Estimated MRR",
      value: formatCurrency(estimatedMRR),
      icon: CreditCard,
      sub: "From active org subscriptions",
    },
    {
      label: "Paying Orgs",
      value: String(totalOrgs),
      icon: Building2,
      sub: "Active + trial organisations",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing Overview</h1>
        <p className="text-muted-foreground">Platform-wide revenue and subscription summary.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {platformPlans.map((plan) => {
              const counts = planMap[plan.name] ?? { active: 0, trial: 0 };
              const total = counts.active + counts.trial;
              const mrr = plan.price * counts.active;
              return (
                <div key={plan.name} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{plan.name}</span>
                    <Badge variant="outline">{formatCurrency(plan.price)}/mo</Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Active</span><span className="font-medium text-foreground">{counts.active}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Trial</span><span className="font-medium text-foreground">{counts.trial}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total</span><span className="font-medium text-foreground">{total}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">MRR from active</p>
                    <p className="font-bold text-emerald-500">{formatCurrency(mrr)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent payments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Client Payments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentPayments.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organisation</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{p.organization.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.planName ?? "—"}</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(p.amount, p.currency)}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(p.createdAt)}</td>
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
