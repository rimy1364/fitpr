import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ClientSidebar } from "@/components/client/ClientSidebar";
import { TopNav } from "@/components/shared/TopNav";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CLIENT") redirect("/login");

  return (
    <div className="flex h-screen bg-background">
      <ClientSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav user={session.user} notificationsPath="/client/notifications" />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
