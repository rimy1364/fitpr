import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Check, Users, UserCheck, Calendar, CreditCard } from "lucide-react";

export const metadata = { title: "Subscription Plan — Admin" };

const PLAN_DETAILS = {
  STARTER: {
    price: 4900,
    features: [
      "Up to 3 Trainers",
      "Up to 30 Clients",
      "Workout Programs",
      "Daily Check-In Tracking",
      "Progress Charts",
      "Email Support",
    ],
  },
  GROWTH: {
    price: 9900,
    features: [
      "Up to 10 Trainers",
      "Up to 100 Clients",
      "Everything in Starter",
      "Form Video Reviews",
      "Advanced Analytics",
      "Priority Support",
    ],
  },
  PRO: {
    price: 19900,
    features: [
      "Unlimited Trainers",
      "Unlimited Clients",
      "Everything in Growth",
      "Custom Branding",
      "API Access",
      "Dedicated Account Manager",
    ],
  },
};

export default async function AdminPlansPage() {
  const session = await getServerSession(authOptions);
  const orgId = session!.user.organizationId!;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      name: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      status: true,
      trialEndsAt: true,
      maxTrainers: true,
      maxClients: true,
      _count: {
        select: {
          users: { where: { role: "TRAINER", isActive: true } },
        },
      },
    },
  });

  if (!org) return null;

  const plan = org.subscriptionPlan;
  const details = PLAN_DETAILS[plan];
  const trainerCount = org._count.users;
  const maxTrainers = org.maxTrainers === -1 ? "∞" : org.maxTrainers;

  const clientCount = await prisma.user.count({
    where: { organizationId: orgId, role: "CLIENT" },
  });
  const maxClients = org.maxClients === -1 ? "∞" : org.maxClients;

  const isTrial = org.subscriptionStatus === "TRIAL";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription Plan</h1>
        <p className="text-muted-foreground">Your current plan and usage limits.</p>
      </div>

      {/* Current Plan Card */}
      <Card className="border-emerald-500/50 bg-emerald-500/5">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-emerald-500" />
              <div>
                <CardTitle className="text-lg">{plan} Plan</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(details.price)}/month
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={org.status} />
              {isTrial && (
                <Badge variant="outline" className="text-amber-600 border-amber-400">
                  Trial
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTrial && org.trialEndsAt && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              Trial period ends on {formatDate(org.trialEndsAt)}. Contact your FitPR account manager to activate your subscription.
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <UserCheck className="h-4 w-4 text-blue-500" />
                Trainers
              </div>
              <p className="text-2xl font-bold">{trainerCount} <span className="text-sm font-normal text-muted-foreground">/ {maxTrainers}</span></p>
              <p className="text-xs text-muted-foreground">Active trainers in your account</p>
            </div>
            <div className="rounded-lg border p-4 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-green-500" />
                Clients
              </div>
              <p className="text-2xl font-bold">{clientCount} <span className="text-sm font-normal text-muted-foreground">/ {maxClients}</span></p>
              <p className="text-xs text-muted-foreground">Total clients in your account</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Plan Features</p>
            <ul className="grid sm:grid-cols-2 gap-2">
              {details.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade options */}
      {plan !== "PRO" && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Upgrade Your Plan</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {(plan === "STARTER" ? ["GROWTH", "PRO"] : ["PRO"]).map((p) => {
              const d = PLAN_DETAILS[p as keyof typeof PLAN_DETAILS];
              return (
                <Card key={p} className="border-dashed">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{p}</CardTitle>
                      <span className="text-sm font-bold text-emerald-600">{formatCurrency(d.price)}/mo</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {d.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground mt-4">
                      Contact your FitPR account manager to upgrade.
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
