import { requireCustomer } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { NotificationsClient } from "./NotificationsClient";

export default async function CustomerNotificationsPage() {
  const user = await requireCustomer();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <NotificationsClient
      initialNotifications={notifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
        type: n.type,
      }))}
    />
  );
}
