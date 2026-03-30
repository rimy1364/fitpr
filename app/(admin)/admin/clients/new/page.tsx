import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddClientForm } from "./add-client-form";

export const metadata = { title: "Add Client" };

export default async function NewClientPage() {
  const session = await getServerSession(authOptions);
  const orgId = session!.user.organizationId!;

  const trainers = await prisma.user.findMany({
    where: { organizationId: orgId, role: "TRAINER", isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Client</h1>
        <p className="text-muted-foreground">Create a login for a new client in your organisation.</p>
      </div>
      <AddClientForm trainers={trainers} />
    </div>
  );
}
