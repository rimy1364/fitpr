import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrgTable } from "@/components/superadmin/OrgTable";
import { Plus } from "lucide-react";
import { OrgStatus } from "@prisma/client";

export const metadata = { title: "Organizations" };

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function OrganizationsPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const statusFilter = status as OrgStatus | undefined;

  const [orgs, statusCounts] = await Promise.all([
    prisma.organization.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { users: true } } },
    }),
    prisma.organization.groupBy({ by: ["status"], _count: true }),
  ]);

  const countMap: Record<string, number> = {};
  statusCounts.forEach((s) => { countMap[s.status] = s._count; });
  const totalCount = Object.values(countMap).reduce((a, b) => a + b, 0);
  const pendingCount = countMap.PENDING ?? 0;

  const filters: { label: string; value: string | undefined; pending?: boolean }[] = [
    { label: `All (${totalCount})`, value: undefined },
    { label: `Pending (${pendingCount})`, value: "PENDING", pending: pendingCount > 0 },
    { label: `Active (${countMap.ACTIVE ?? 0})`, value: "ACTIVE" },
    { label: `Trial (${countMap.TRIAL ?? 0})`, value: "TRIAL" },
    { label: `Suspended (${countMap.SUSPENDED ?? 0})`, value: "SUSPENDED" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">Manage all fitness organizations on the platform.</p>
        </div>
        <Button asChild>
          <Link href="/superadmin/organizations/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Organization
          </Link>
        </Button>
      </div>

      {pendingCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <strong>{pendingCount}</strong> organisation{pendingCount > 1 ? "s" : ""} awaiting
          approval.{" "}
          <Link
            href="?status=PENDING"
            className="font-semibold underline underline-offset-2 hover:text-amber-900"
          >
            Review now →
          </Link>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <Button
            key={f.label}
            variant={statusFilter === f.value ? "default" : f.pending ? "outline" : "outline"}
            size="sm"
            className={
              f.pending
                ? "border-amber-400 text-amber-700 hover:bg-amber-50"
                : ""
            }
            asChild
          >
            <Link href={f.value ? `?status=${f.value}` : "/superadmin/organizations"}>
              {f.label}
            </Link>
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <OrgTable orgs={orgs} />
        </CardContent>
      </Card>
    </div>
  );
}
