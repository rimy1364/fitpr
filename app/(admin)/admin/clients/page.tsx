import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import Link from "next/link";
import { Plus, ExternalLink } from "lucide-react";
import { formatDate, formatGoal } from "@/lib/utils";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  const orgId = session!.user.organizationId!;

  const clients = await prisma.user.findMany({
    where: { organizationId: orgId, role: "CLIENT" },
    include: {
      clientProfile: {
        include: {
          user: false,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Get trainer names for assigned trainers
  const trainerIds = [...new Set(clients.map((c) => c.clientProfile?.assignedTrainerId).filter(Boolean))] as string[];
  const trainers = await prisma.user.findMany({
    where: { id: { in: trainerIds } },
    select: { id: true, name: true },
  });
  const trainerMap: Record<string, string> = {};
  trainers.forEach((t) => { trainerMap[t.id] = t.name; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">{clients.length} clients in your organization</p>
        </div>
        <Button asChild>
          <Link href="/admin/clients/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {clients.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">No clients yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>Trainer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.clientProfile?.goal ? formatGoal(client.clientProfile.goal) : "—"}
                    </TableCell>
                    <TableCell>
                      {client.clientProfile?.assignedTrainerId
                        ? trainerMap[client.clientProfile.assignedTrainerId] ?? "—"
                        : "Unassigned"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={client.clientProfile?.status ?? "ACTIVE"} />
                    </TableCell>
                    <TableCell>{formatDate(client.createdAt)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/clients/${client.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
