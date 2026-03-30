import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AddTrainerForm } from "./add-trainer-form";

export const metadata = { title: "Add Trainer" };

export default async function NewTrainerPage() {
  const session = await getServerSession(authOptions);
  const orgId = session!.user.organizationId!;

  const [org, trainerCount] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { maxTrainers: true } }),
    prisma.user.count({ where: { organizationId: orgId, role: "TRAINER", isActive: true } }),
  ]);

  if (org && org.maxTrainers !== -1 && trainerCount >= org.maxTrainers) {
    redirect("/admin/trainers");
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Trainer</h1>
        <p className="text-muted-foreground">Create a login for a new trainer in your organisation.</p>
      </div>
      <AddTrainerForm />
    </div>
  );
}
