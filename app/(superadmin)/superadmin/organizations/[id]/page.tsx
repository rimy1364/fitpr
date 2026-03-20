import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CopyLinkBox } from "@/components/shared/CopyLinkBox";
import { formatDate, formatCurrency } from "@/lib/utils";
import { OrgDetailActions } from "./org-detail-actions";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Calendar, Link2, UserCheck } from "lucide-react";

export const metadata = { title: "Organization Details" };

interface Props { params: Promise<{ id: string }> }

export default async function OrgDetailPage({ params }: Props) {
  const { id } = await params;

  const [org, pendingInvites, totalRevenue] = await Promise.all([
    prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: { select: { users: true, clientPayments: true } },
      },
    }),
    prisma.orgInvite.findMany({
      where: { organizationId: id, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.clientPayment.aggregate({
      where: { organizationId: id, status: "PAID" },
      _sum: { amount: true },
    }),
  ]);

  if (!org) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const trainers = org.users.filter((u) => u.role === "TRAINER");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
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

      {/* Pending invites — shown when email isn't set up or invite not yet accepted */}
      {pendingInvites.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800 text-base">
              <Link2 className="h-4 w-4" />
              Pending Invite Links
            </CardTitle>
            <p className="text-sm text-amber-700">
              Email delivery may not be configured. Share these links manually with each recipient.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-amber-800">
                  <UserCheck className="h-4 w-4" />
                  <span className="font-medium">{invite.email}</span>
                  <Badge variant="outline" className="text-xs">{invite.role}</Badge>
                  <span className="text-xs text-amber-600 ml-auto">
                    Expires {formatDate(invite.expiresAt)}
                  </span>
                </div>
                <CopyLinkBox
                  label="Setup link"
                  value={`${appUrl}/setup-account/${invite.token}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pending application info */}
      {org.status === "PENDING" && org.pendingAdminEmail && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 flex items-center gap-3 text-sm text-blue-800">
            <UserCheck className="h-5 w-5 flex-shrink-0" />
            <div>
              Admin contact: <strong>{org.pendingAdminName}</strong> ({org.pendingAdminEmail}).
              Approve this organisation to send them an invite.
            </div>
          </CardContent>
        </Card>
      )}

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
              <div className="text-sm text-amber-600">
                Trial ends {formatDate(org.trialEndsAt)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Members ({org._count.users})</CardTitle></CardHeader>
          <CardContent>
            {org.users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet — waiting for admin to accept the invite.</p>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
