import { prisma } from '@charmverse/core/prisma-client';

export interface MarkNotification {
  id: string;
}

export async function markNotifications(tasks: MarkNotification[]) {
  const taskIds = tasks.map((userNotification) => userNotification.id);

  await prisma.userNotificationMetadata.updateMany({
    where: {
      id: {
        in: taskIds
      }
    },
    data: {
      seenAt: new Date(),
      channel: 'webapp'
    }
  });
}
