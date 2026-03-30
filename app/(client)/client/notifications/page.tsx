import { Bell } from "lucide-react";

export const metadata = { title: "Notifications — Client" };

export default function ClientNotificationsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-3">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <Bell className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold">Notifications</h2>
      <p className="text-muted-foreground max-w-sm">
        You&apos;re all caught up. Notifications will appear here.
      </p>
    </div>
  );
}
