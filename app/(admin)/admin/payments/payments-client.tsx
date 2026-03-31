"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { IndianRupee, CheckCircle2, Clock, AlertCircle, Loader2, Send } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface Payment {
  id: string;
  clientId: string;
  amount: number;
  status: string;
  billingPeriod: string | null;
  dueDate: string | Date | null;
  paidAt: string | Date | null;
  notes: string | null;
  client: { id: string; name: string; email: string };
}

interface ClientProfile {
  userId: string;
  quarterlyFee: number | null;
  user: { id: string; name: string; email: string };
}

interface Stats {
  total: number;
  paid: number;
  pending: number;
  totalAmount: number;
  collectedAmount: number;
}

interface Props {
  initialPayments: Payment[];
  allClients: ClientProfile[];
  currentPeriod: string;
  periods: string[];
  stats: Stats;
}

function formatINR(amount: number) {
  return "₹" + amount.toLocaleString("en-IN");
}

function formatDate(d: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function PaymentsClient({ initialPayments, allClients, currentPeriod, periods, stats }: Props) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [isGenerating, setIsGenerating] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);
  const router = useRouter();
  const { toast } = useToast();

  const clientsWithFee = allClients.filter((c) => c.quarterlyFee && c.quarterlyFee > 0);
  const invoicedIds = new Set(payments.map((p) => p.clientId));
  const uninvoiced = clientsWithFee.filter((c) => !invoicedIds.has(c.userId));

  const loadPeriod = async (period: string) => {
    setSelectedPeriod(period);
    const res = await fetch(`/api/admin/payments?period=${period}`);
    const json = await res.json();
    setPayments(json.data ?? []);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: selectedPeriod }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Error", description: json.error });
        return;
      }
      toast({ title: "Invoices generated", description: json.message });
      router.refresh();
      await loadPeriod(selectedPeriod);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong." });
    } finally {
      setIsGenerating(false);
    }
  };

  const markPaid = async (id: string) => {
    setMarkingId(id);
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Error", description: json.error });
        return;
      }
      setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status: "PAID", paidAt: new Date() } : p)));
      toast({ title: "Payment marked as paid" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong." });
    } finally {
      setMarkingId(null);
    }
  };

  const statusBadge = (status: string) => {
    if (status === "PAID") return <Badge className="bg-emerald-100 text-emerald-800 border-0">Paid</Badge>;
    if (status === "PENDING") return <Badge className="bg-yellow-100 text-yellow-800 border-0">Pending</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Client Payments</h1>
          <p className="text-muted-foreground">Quarterly billing for your clients</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => loadPeriod(e.target.value)}
            className="text-sm border rounded-md px-3 py-2 bg-background"
          >
            {periods.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {uninvoiced.length > 0 && selectedPeriod === currentPeriod && (
            <ConfirmDialog
              trigger={
                <Button disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Generate Invoices ({uninvoiced.length})
                </Button>
              }
              title={`Generate invoices for ${selectedPeriod}?`}
              description={`This will create ${uninvoiced.length} invoice(s) for clients who don't yet have one for ${selectedPeriod}.`}
              confirmLabel="Generate"
              variant="default"
              onConfirm={handleGenerate}
            />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Invoices", value: stats.total, icon: IndianRupee, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
          { label: "Paid", value: stats.paid, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950" },
          { label: "Collected", value: formatINR(stats.collectedAmount), icon: IndianRupee, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </div>
              <div className={`h-11 w-11 rounded-full flex items-center justify-center ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Clients without fee warning */}
      {allClients.filter((c) => !c.quarterlyFee).length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-700 p-4">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-300">Some clients have no quarterly fee set</p>
            <p className="text-amber-700 dark:text-amber-400 mt-0.5">
              {allClients.filter((c) => !c.quarterlyFee).map((c) => c.user.name).join(", ")} — edit their profile to set a fee.
            </p>
          </div>
        </div>
      )}

      {/* Payments table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices — {selectedPeriod}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-muted-foreground">No invoices for {selectedPeriod} yet.</p>
              {uninvoiced.length > 0 && selectedPeriod === currentPeriod && (
                <p className="text-sm text-muted-foreground">
                  Click <strong>Generate Invoices</strong> to create invoices for all {uninvoiced.length} client(s) with a fee set.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Paid On</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.client.name}</p>
                        <p className="text-xs text-muted-foreground">{p.client.email}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold">{formatINR(p.amount)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(p.dueDate)}</td>
                      <td className="px-4 py-3">{statusBadge(p.status)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(p.paidAt)}</td>
                      <td className="px-4 py-3">
                        {p.status !== "PAID" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            disabled={markingId === p.id}
                            onClick={() => markPaid(p.id)}
                          >
                            {markingId === p.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            )}
                            Mark Paid
                          </Button>
                        )}
                      </td>
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
