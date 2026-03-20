import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SetupAccountForm } from "./setup-account-form";
import { Dumbbell } from "lucide-react";

export const metadata = { title: "Set Up Your Account" };

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SetupAccountPage({ params }: Props) {
  const { token } = await params;
  const invite = await prisma.orgInvite.findUnique({
    where: { token },
    include: { organization: { select: { name: true, logo: true } } },
  });

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    notFound();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Dumbbell className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome to {invite.organization.name}
          </h1>
          <p className="text-gray-500 mt-2">Set a password to activate your account</p>
          <p className="text-sm text-gray-400 mt-1">{invite.email}</p>
        </div>
        <SetupAccountForm token={token} email={invite.email} role={invite.role} />
      </div>
    </div>
  );
}
