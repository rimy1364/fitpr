import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { OrgDetailActions } from "./org-detail-actions";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Calendar } from "lucide-react";

export const metadata = { title: "Organization Details" };

interface Props { params: Promise<{ id: string }> }

export default async function OrgDetailPage({ params }: Props) {
  const { id } = await params;
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      users: {
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: { select: { users: true, clientPayments: true } },
    },
  });

  if (!org) notFound();

  const totalRevenue = await prisma.clientPayment.aggregate({
    where: { organizationId: org.id, status: "PAID" },
    _sum: { amount: true },
  });

  const trainers = org.users.filter((u) => u.role === "TRAINER");
  const clients = org.users.filter((u) => u.role === "CLIENT");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <p className="text-muted-foreground">/{org.slug}</p>
        </div>
        <OrgDetailActions org={org} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Status", value: <StatusBadge status={org.status} /> },
          { label: "Plan", value: <Badge variant="outline">{org.subscriptionPlan}</Badge> },
          { label: "Trainers", value: `${trainers.length} / ${org.maxTrainers === -1 ? "∞" : org.maxTrainers}` },
          { label: "Revenue", value: formatCurrency(totalRevenue._sum.amount ?? 0) },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <div className="mt-1 font-semibold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {org.email}
            </div>
            {org.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {org.phone}
              </div>
            )}
            {org.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {org.address}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Joined {formatDate(org.createdAt)}
            </div>
            {org.trialEndsAt && org.status === "TRIAL" && (
              <div className="text-sm text-warning">
                Trial ends {formatDate(org.trialEndsAt)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Members ({org._count.users})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {org.users.map((user) => (
                <div key={user.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{user.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
