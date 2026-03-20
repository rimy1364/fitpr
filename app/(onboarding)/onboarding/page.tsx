import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata = { title: "Welcome to FitPR" };

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CLIENT") redirect("/login");

  // Check if already onboarded
  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { goal: true, startWeight: true },
  });

  if (profile?.goal && profile?.startWeight) {
    redirect("/client/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <OnboardingWizard userName={session.user.name} />
    </div>
  );
}
