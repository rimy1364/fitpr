import Pusher from "pusher";
import PusherJS from "pusher-js";

// Server-side Pusher
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// Client-side Pusher (singleton)
let pusherClient: PusherJS | null = null;

export function getPusherClient(): PusherJS {
  if (!pusherClient) {
    pusherClient = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  return pusherClient;
}

// Channel name helpers
export const channelNames = {
  userNotifications: (userId: string) => `private-user-${userId}`,
  chat: (userId1: string, userId2: string) => {
    const sorted = [userId1, userId2].sort();
    return `private-chat-${sorted[0]}-${sorted[1]}`;
  },
  org: (orgId: string) => `private-org-${orgId}`,
};

// Event names
export const pusherEvents = {
  NEW_MESSAGE: "new-message",
  NEW_NOTIFICATION: "new-notification",
  VIDEO_UPLOADED: "video-uploaded",
  CHECK_IN_SUBMITTED: "check-in-submitted",
};

export async function triggerNotification(userId: string, notification: {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: Date;
}) {
  await pusherServer.trigger(
    channelNames.userNotifications(userId),
    pusherEvents.NEW_NOTIFICATION,
    notification
  );
}

export async function triggerMessage(
  senderId: string,
  receiverId: string,
  message: unknown
) {
  await pusherServer.trigger(
    channelNames.chat(senderId, receiverId),
    pusherEvents.NEW_MESSAGE,
    message
  );
}
