import { prisma } from '@charmverse/core/prisma-client';

export interface MarkNotification {
  id: string;
}

export async function markNotifications(tasks: MarkNotification[]) {
  const notificationIds = tasks.map((n) => n.id);

  await prisma.userNotificationMetadata.updateMany({
    where: {
      id: {
        in: notificationIds
      }
    },
    data: {
      seenAt: new Date(),
      channel: 'webapp'
    }
  });
}
