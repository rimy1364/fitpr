import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { TrainerSidebar } from "@/components/trainer/TrainerSidebar";
import { TopNav } from "@/components/shared/TopNav";

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TRAINER") redirect("/login");

  return (
    <div className="flex h-screen bg-background">
      <TrainerSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav user={session.user} notificationsPath="/trainer/notifications" />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
