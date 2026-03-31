"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Landmark, Loader2, Save } from "lucide-react";

interface Props {
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankIfscCode?: string | null;
  bankUpiId?: string | null;
}

export function BankDetailsForm({ bankName, bankAccountName, bankAccountNumber, bankIfscCode, bankUpiId }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit } = useForm({
    defaultValues: {
      bankName: bankName ?? "",
      bankAccountName: bankAccountName ?? "",
      bankAccountNumber: bankAccountNumber ?? "",
      bankIfscCode: bankIfscCode ?? "",
      bankUpiId: bankUpiId ?? "",
    },
  });

  const onSubmit = async (data: Record<string, string>) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Error", description: json.error });
        return;
      }
      toast({ title: "Bank details saved", description: "Clients will see these details on their payment invoices." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="h-5 w-5" />
          Bank Details for Client Payments
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Clients will see these details when they need to make their quarterly payment.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input id="bankName" placeholder="e.g. HDFC Bank" {...register("bankName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccountName">Account Holder Name</Label>
              <Input id="bankAccountName" placeholder="e.g. FitZone Gym Pvt Ltd" {...register("bankAccountName")} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankAccountNumber">Account Number</Label>
              <Input id="bankAccountNumber" placeholder="e.g. 1234567890" {...register("bankAccountNumber")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankIfscCode">IFSC Code</Label>
              <Input id="bankIfscCode" placeholder="e.g. HDFC0001234" {...register("bankIfscCode")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankUpiId">UPI ID (optional)</Label>
              <Input id="bankUpiId" placeholder="e.g. fitzoneGym@hdfcbank" {...register("bankUpiId")} />
            <p className="text-xs text-muted-foreground">Clients can use this to pay directly via UPI apps</p>
          </div>
          <Button type="submit" disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Bank Details
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
