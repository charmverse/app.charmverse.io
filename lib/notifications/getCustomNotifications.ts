import { prisma } from '@charmverse/core/prisma-client';

import type { CustomNotification } from './interfaces';
import { notificationMetadataSelectStatement, queryCondition, type QueryCondition } from './utils';

export async function getCustomNotifications({ id, userId }: QueryCondition): Promise<CustomNotification[]> {
  const customNotifications = await prisma.customNotification.findMany({
    where: {
      ...queryCondition({ id, userId })
    },
    select: {
      id: true,
      type: true,
      content: true,
      notificationMetadata: {
        select: notificationMetadataSelectStatement
      }
    }
  });

  return customNotifications.map((notification) => {
    const customNotification = {
      archived: !!notification.notificationMetadata.archivedAt,
      content: notification.content,
      createdAt: notification.notificationMetadata.createdAt.toISOString(),
      id: notification.id,
      createdBy: notification.notificationMetadata.author,
      group: 'custom',
      read: !!notification.notificationMetadata.seenAt,
      spaceDomain: notification.notificationMetadata.space.domain,
      spaceId: notification.notificationMetadata.spaceId,
      spaceName: notification.notificationMetadata.space.name,
      type: notification.type
    } as CustomNotification;

    return customNotification;
  });
}
