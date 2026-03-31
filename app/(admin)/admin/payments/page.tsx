import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentsClient } from "./payments-client";

export const metadata = { title: "Client Payments — Admin" };

function currentBillingPeriod() {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

function allPeriods(): string[] {
  const now = new Date();
  const periods: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
    const q = Math.ceil((d.getMonth() + 1) / 3);
    periods.push(`${d.getFullYear()}-Q${q}`);
  }
  return [...new Set(periods)];
}

export default async function AdminPaymentsPage() {
  const session = await getServerSession(authOptions);
  const orgId = session!.user.organizationId!;
  const period = currentBillingPeriod();

  const [payments, allClients] = await Promise.all([
    prisma.clientPayment.findMany({
      where: { organizationId: orgId, billingPeriod: period },
      include: { client: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.clientProfile.findMany({
      where: {
        user: { organizationId: orgId, isActive: true, role: "CLIENT" },
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  const stats = {
    total: payments.length,
    paid: payments.filter((p) => p.status === "PAID").length,
    pending: payments.filter((p) => p.status === "PENDING").length,
    totalAmount: payments.reduce((s, p) => s + p.amount, 0),
    collectedAmount: payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0),
  };

  return (
    <PaymentsClient
      initialPayments={payments}
      allClients={allClients}
      currentPeriod={period}
      periods={allPeriods()}
      stats={stats}
    />
  );
}
