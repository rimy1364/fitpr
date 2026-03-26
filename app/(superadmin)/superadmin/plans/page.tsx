import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PlanEditForm } from "./plan-edit-form";

export const metadata = { title: "Platform Plans" };

export default async function PlansPage() {
  const plans = await prisma.platformPlan.findMany({
    orderBy: { price: "asc" },
  });

  const orgCounts = await prisma.organization.groupBy({
    by: ["subscriptionPlan"],
    _count: true,
  });
  const countMap: Record<string, number> = {};
  orgCounts.forEach((o) => { countMap[o.subscriptionPlan] = o._count; });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Plans</h1>
        <p className="text-muted-foreground">Manage pricing, limits, and features for each plan tier.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const orgsOnPlan = countMap[plan.name] ?? 0;
          const features = plan.features as string[];
          return (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <Badge variant="outline">{orgsOnPlan} org{orgsOnPlan !== 1 ? "s" : ""}</Badge>
                </div>
                <CardDescription>
                  <span className="text-3xl font-extrabold text-foreground">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {plan.maxTrainers === -1 ? "Unlimited" : plan.maxTrainers} trainers
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {plan.maxClients === -1 ? "Unlimited" : plan.maxClients} clients
                    </span>
                  </div>
                </div>

                {features.length > 0 && (
                  <ul className="space-y-1.5">
                    {features.map((f: string) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                <PlanEditForm plan={plan} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {plans.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No platform plans found. Run <code className="text-xs bg-muted px-1 py-0.5 rounded">prisma db seed</code> to create the default plans.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
