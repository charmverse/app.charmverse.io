import { prisma } from "@charmverse/core/prisma-client";

async function removeDuplicateNotifications() {
  const notificationsMetadata = await prisma.userNotificationMetadata.findMany({
    select: {
      userId: true,
      createdAt: true,
      id: true
    }
  })

  const userIdCreatedAtNotificationsRecord: Record<string, typeof notificationsMetadata[0][]> = {};
  notificationsMetadata.forEach(notificationMetadata => {
    const { userId, createdAt } = notificationMetadata;
    const key = `${userId}.${createdAt}`
    if (!userIdCreatedAtNotificationsRecord[key]) {
      userIdCreatedAtNotificationsRecord[key] = [];
    }

    userIdCreatedAtNotificationsRecord[key].push(notificationMetadata);
  })

  const notificationMetadataIds = Object.values(userIdCreatedAtNotificationsRecord)
    .filter(notifications => notifications.length > 1)
    .map(notifications => notifications.slice(1).map(notification => notification.id).flat())
    .flat();

  await prisma.userNotificationMetadata.deleteMany({
    where: {
      id: {
        in: notificationMetadataIds
      }
    }
  })
}

removeDuplicateNotifications()