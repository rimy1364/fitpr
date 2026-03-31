import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Building2, Mail, Phone, MapPin, Calendar, Shield } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { BankDetailsForm } from "./bank-details-form";

export const metadata = { title: "Settings — Admin" };

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  const orgId = session!.user.organizationId!;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      name: true,
      slug: true,
      email: true,
      phone: true,
      address: true,
      status: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      createdAt: true,
      bankName: true,
      bankAccountName: true,
      bankAccountNumber: true,
      bankIfscCode: true,
      bankUpiId: true,
    },
  });

  if (!org) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Your organisation details and payment configuration.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organisation Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Organisation Name</p>
              <p className="font-medium">{org.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Slug</p>
              <p className="font-medium font-mono text-sm">/{org.slug}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {org.email && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                  <p className="text-sm">{org.email}</p>
                </div>
              </div>
            )}
            {org.phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                  <p className="text-sm">{org.phone}</p>
                </div>
              </div>
            )}
          </div>
          {org.address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Address</p>
                <p className="text-sm">{org.address}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Member Since</p>
              <p className="text-sm">{formatDate(org.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Account Status</span>
            <StatusBadge status={org.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Subscription Plan</span>
            <Badge variant="outline">{org.subscriptionPlan}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Subscription Status</span>
            <Badge variant={org.subscriptionStatus === "TRIAL" ? "secondary" : "default"}>
              {org.subscriptionStatus}
            </Badge>
          </div>
          {org.trialEndsAt && org.subscriptionStatus === "TRIAL" && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Trial Ends</span>
              <span className="text-sm font-medium text-amber-600">{formatDate(org.trialEndsAt)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Details — editable */}
      <BankDetailsForm
        bankName={org.bankName}
        bankAccountName={org.bankAccountName}
        bankAccountNumber={org.bankAccountNumber}
        bankIfscCode={org.bankIfscCode}
        bankUpiId={org.bankUpiId}
      />
    </div>
  );
}
