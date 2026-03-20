import { Badge } from "@/components/ui/badge";
import { OrgStatus, SubscriptionStatus, ClientStatus, FormVideoStatus, PaymentStatus } from "@prisma/client";

type AnyStatus = OrgStatus | SubscriptionStatus | ClientStatus | FormVideoStatus | PaymentStatus | string;

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  // OrgStatus
  ACTIVE: { label: "Active", variant: "success" },
  TRIAL: { label: "Trial", variant: "info" },
  SUSPENDED: { label: "Suspended", variant: "warning" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  // SubscriptionStatus
  PAST_DUE: { label: "Past Due", variant: "destructive" },
  // ClientStatus
  PAUSED: { label: "Paused", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "secondary" },
  // FormVideoStatus
  PENDING: { label: "Pending", variant: "warning" },
  REVIEWED: { label: "Reviewed", variant: "success" },
  // PaymentStatus
  PAID: { label: "Paid", variant: "success" },
  FAILED: { label: "Failed", variant: "destructive" },
  REFUNDED: { label: "Refunded", variant: "secondary" },
};

interface Props {
  status: AnyStatus;
  className?: string;
}

export function StatusBadge({ status, className }: Props) {
  const config = statusConfig[status] ?? { label: status, variant: "outline" as const };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
