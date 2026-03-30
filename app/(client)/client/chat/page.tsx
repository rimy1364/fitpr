import { MessageSquare } from "lucide-react";

export const metadata = { title: "Chat — Client" };

export default function ClientChatPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-3">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <MessageSquare className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold">Chat</h2>
      <p className="text-muted-foreground max-w-sm">
        Messaging with your trainer will be available here. Coming soon.
      </p>
    </div>
  );
}
