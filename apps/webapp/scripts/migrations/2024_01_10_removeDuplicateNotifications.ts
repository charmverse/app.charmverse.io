import { prisma } from '@charmverse/core/prisma-client';

async function removeDuplicateNotifications() {
  const notificationsMetadata = await prisma.userNotificationMetadata.findMany({
    select: {
      userId: true,
      createdAt: true,
      id: true
    }
  });

  const userIdCreatedAtNotificationsSet: Set<string> = new Set();
  const notificationMetadataIds: string[] = [];
  notificationsMetadata.forEach((notificationMetadata) => {
    const { userId, createdAt } = notificationMetadata;
    const key = `${userId}.${createdAt}`;

    if (userIdCreatedAtNotificationsSet.has(key)) {
      notificationMetadataIds.push(notificationMetadata.id);
    } else {
      userIdCreatedAtNotificationsSet.add(key);
    }
  });

  await prisma.userNotificationMetadata.deleteMany({
    where: {
      id: {
        in: notificationMetadataIds
      }
    }
  });
}

removeDuplicateNotifications();
