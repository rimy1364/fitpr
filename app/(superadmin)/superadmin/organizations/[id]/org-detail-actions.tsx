"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/ui/use-toast";
import { OrgStatus, PlatformPlanName } from "@prisma/client";
import { Ban, RefreshCw, CheckCircle2, Loader2 } from "lucide-react";

interface Org {
  id: string;
  status: OrgStatus;
  subscriptionPlan: PlatformPlanName;
  pendingAdminName?: string | null;
  pendingAdminEmail?: string | null;
}

export function OrgDetailActions({ org }: { org: Org }) {
  const [plan, setPlan] = useState<PlatformPlanName>(org.subscriptionPlan);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const updateOrg = async (data: Record<string, unknown>) => {
    const res = await fetch(`/api/superadmin/organizations/${org.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    router.refresh();
  };

  const handleChangePlan = async () => {
    setIsChangingPlan(true);
    try {
      await updateOrg({ subscriptionPlan: plan });
      toast({ title: "Plan updated", description: `Plan changed to ${plan}` });
    } catch (e: unknown) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    } finally {
      setIsChangingPlan(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await updateOrg({ action: "approve" });
      toast({
        title: "Account approved!",
        description: `Invite email sent to ${org.pendingAdminEmail}`,
      });
    } catch (e: unknown) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    } finally {
      setIsApproving(false);
    }
  };

  const isSuspended = org.status === "SUSPENDED";
  const isPending = org.status === "PENDING";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {isPending ? (
        <ConfirmDialog
          trigger={
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" disabled={isApproving}>
              {isApproving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Approve & Send Invite
            </Button>
          }
          title="Approve Account?"
          description={
            org.pendingAdminEmail
              ? `This will activate the account on a 14-day trial and send an invite to ${org.pendingAdminEmail} to set up their admin account.`
              : "This will activate the account on a 14-day trial."
          }
          confirmLabel="Approve"
          variant="default"
          onConfirm={handleApprove}
        />
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Select value={plan} onValueChange={(v) => setPlan(v as PlatformPlanName)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STARTER">Starter</SelectItem>
                <SelectItem value="GROWTH">Growth</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleChangePlan}
              disabled={isChangingPlan || plan === org.subscriptionPlan}
            >
              Update Plan
            </Button>
          </div>

          <ConfirmDialog
            trigger={
              <Button size="sm" variant={isSuspended ? "outline" : "destructive"}>
                {isSuspended ? (
                  <RefreshCw className="mr-2 h-4 w-4" />
                ) : (
                  <Ban className="mr-2 h-4 w-4" />
                )}
                {isSuspended ? "Reactivate" : "Suspend"}
              </Button>
            }
            title={isSuspended ? "Reactivate Account?" : "Suspend Account?"}
            description={
              isSuspended
                ? "This will restore access for all users in this account."
                : "This will immediately block all users in this account from logging in."
            }
            confirmLabel={isSuspended ? "Reactivate" : "Suspend"}
            variant={isSuspended ? "default" : "destructive"}
            onConfirm={() => updateOrg({ status: isSuspended ? "ACTIVE" : "SUSPENDED" })}
          />
        </>
      )}
    </div>
  );
}
