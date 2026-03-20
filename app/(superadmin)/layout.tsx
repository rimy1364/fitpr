import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SuperAdminSidebar } from "@/components/superadmin/SuperAdminSidebar";
import { TopNav } from "@/components/shared/TopNav";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login");

  return (
    <div className="flex h-screen bg-background">
      <SuperAdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav user={session.user} notificationsPath="/superadmin/notifications" />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
