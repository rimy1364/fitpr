import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PaymentCheckoutButton } from "@/components/client/PaymentCard";
import { CreditCard } from "lucide-react";

export const metadata = { title: "Payments" };

interface Props {
  searchParams: Promise<{ success?: string; cancelled?: string }>;
}

export default async function ClientPaymentsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const orgId = session!.user.organizationId!;

  const [payments, plans] = await Promise.all([
    prisma.clientPayment.findMany({
      where: { clientId: userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.orgSubscriptionPlan.findMany({
      where: { organizationId: orgId, isActive: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground">Manage your subscription and payment history.</p>
      </div>

      {sp.success && (
        <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md text-green-800 dark:text-green-200">
          Payment successful! Welcome aboard.
        </div>
      )}

      {plans.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Available Plans</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {formatCurrency(plan.price)}
                    <span className="text-sm text-muted-foreground font-normal">/{plan.interval.toLowerCase()}</span>
                  </p>
                  {Array.isArray(plan.features) && plan.features.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {(plan.features as string[]).map((f) => (
                        <li key={f} className="text-sm text-muted-foreground">✓ {f}</li>
                      ))}
                    </ul>
                  )}
                  <PaymentCheckoutButton planId={plan.id} className="mt-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Payment History</CardTitle></CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No payments yet.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{p.planName ?? "Subscription"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatCurrency(p.amount, p.currency)}</span>
                    <StatusBadge status={p.status} />
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
