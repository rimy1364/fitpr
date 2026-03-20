"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import { OrgStatus, SubscriptionStatus, PlatformPlanName } from "@prisma/client";
import { ExternalLink } from "lucide-react";

interface Org {
  id: string;
  name: string;
  slug: string;
  email: string;
  status: OrgStatus;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: PlatformPlanName;
  createdAt: Date;
  _count: { users: number };
}

interface Props {
  orgs: Org[];
}

export function OrgTable({ orgs }: Props) {
  if (orgs.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">No organizations yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Account</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Members</TableHead>
          <TableHead>Created</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {orgs.map((org) => (
          <TableRow key={org.id}>
            <TableCell>
              <div>
                <p className="font-medium">{org.name}</p>
                <p className="text-xs text-muted-foreground">{org.email}</p>
              </div>
            </TableCell>
            <TableCell>
              <span className="text-sm font-medium capitalize">{org.subscriptionPlan.toLowerCase()}</span>
            </TableCell>
            <TableCell>
              <StatusBadge status={org.status} />
            </TableCell>
            <TableCell>{org._count.users}</TableCell>
            <TableCell>{formatDate(org.createdAt)}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/superadmin/organizations/${org.id}`}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
