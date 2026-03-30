import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, TrendingUp, Users, Calendar } from "lucide-react";

export const metadata = { title: "Billing — Admin" };

export default async function AdminBillingPage() {
  const session = await getServerSession(authOptions);
  const orgId = session!.user.organizationId!;

  const [allTimeRevenue, monthlyRevenue, recentPayments, clientCount] = await Promise.all([
    prisma.clientPayment.aggregate({
      where: { organizationId: orgId, status: "PAID" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.clientPayment.aggregate({
      where: {
        organizationId: orgId,
        status: "PAID",
        paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { amount: true },
    }),
    prisma.clientPayment.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        client: { select: { name: true, email: true } },
      },
    }),
    prisma.user.count({ where: { organizationId: orgId, role: "CLIENT" } }),
  ]);

  const stats = [
    {
      title: "All-Time Revenue",
      value: formatCurrency(allTimeRevenue._sum.amount ?? 0),
      sub: `${allTimeRevenue._count} payments`,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950",
    },
    {
      title: "This Month",
      value: formatCurrency(monthlyRevenue._sum.amount ?? 0),
      sub: "Month to date",
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Total Clients",
      value: clientCount,
      sub: "Active in account",
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950",
    },
  ];

  const statusColors: Record<string, string> = {
    PAID: "bg-emerald-100 text-emerald-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    FAILED: "bg-red-100 text-red-800",
    REFUNDED: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Revenue and payment history for your account.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{s.title}</p>
                <p className="mt-1 text-2xl font-bold">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${s.bg}`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-3 text-left font-medium">Client</th>
                    <th className="pb-3 text-left font-medium">Amount</th>
                    <th className="pb-3 text-left font-medium">Status</th>
                    <th className="pb-3 text-left font-medium">Date</th>
                    <th className="pb-3 text-left font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentPayments.map((p) => (
                    <tr key={p.id} className="py-3">
                      <td className="py-3 pr-4">
                        <p className="font-medium">{p.client?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{p.client?.email}</p>
                      </td>
                      <td className="py-3 pr-4 font-medium">{formatCurrency(p.amount)}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status] ?? ""}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(p.paidAt ?? p.createdAt)}
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground text-xs">{p.notes ?? "—"}</td>
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
