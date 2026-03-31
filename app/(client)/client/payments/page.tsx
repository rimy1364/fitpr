import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard, Landmark, IndianRupee, AlertCircle } from "lucide-react";

export const metadata = { title: "Payments" };

export default async function ClientPaymentsPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const orgId = session!.user.organizationId!;

  const [payments, org, profile] = await Promise.all([
    prisma.clientPayment.findMany({
      where: { clientId: userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        name: true,
        bankName: true,
        bankAccountName: true,
        bankAccountNumber: true,
        bankIfscCode: true,
        bankUpiId: true,
      },
    }),
    prisma.clientProfile.findUnique({
      where: { userId },
      select: { quarterlyFee: true },
    }),
  ]);

  const pending = payments.filter((p) => p.status === "PENDING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground">Your quarterly billing and payment history.</p>
      </div>

      {/* Pending payment alert */}
      {pending.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-700 p-4">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-300">
              {pending.length} payment{pending.length > 1 ? "s" : ""} pending
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              Please pay using the bank details below and notify your trainer once paid.
            </p>
          </div>
        </div>
      )}

      {/* Quarterly fee info */}
      {profile?.quarterlyFee && (
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center flex-shrink-0">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your quarterly fee</p>
              <p className="text-2xl font-bold">{formatCurrency(profile.quarterlyFee)}</p>
              <p className="text-xs text-muted-foreground">Billed every quarter by {org?.name}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bank details */}
      {org && (org.bankAccountNumber || org.bankUpiId) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Pay to {org.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Transfer your quarterly fee to the following account and notify your trainer.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {org.bankAccountNumber && (
              <div className="grid sm:grid-cols-2 gap-4 rounded-lg border p-4 bg-muted/30">
                {org.bankName && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Bank</p>
                    <p className="font-medium">{org.bankName}</p>
                  </div>
                )}
                {org.bankAccountName && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Account Name</p>
                    <p className="font-medium">{org.bankAccountName}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Account Number</p>
                  <p className="font-medium font-mono">{org.bankAccountNumber}</p>
                </div>
                {org.bankIfscCode && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">IFSC Code</p>
                    <p className="font-medium font-mono">{org.bankIfscCode}</p>
                  </div>
                )}
              </div>
            )}
            {org.bankUpiId && (
              <div className="rounded-lg border p-4 bg-muted/30">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">UPI ID</p>
                <p className="font-medium font-mono text-lg">{org.bankUpiId}</p>
                <p className="text-xs text-muted-foreground mt-1">Use any UPI app — Google Pay, PhonePe, Paytm, etc.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No payments yet.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{p.billingPeriod ?? p.planName ?? "Payment"}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.paidAt ? `Paid on ${formatDate(p.paidAt)}` : p.dueDate ? `Due ${formatDate(p.dueDate)}` : formatDate(p.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(p.amount)}</span>
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
