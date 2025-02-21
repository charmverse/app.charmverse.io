import { prisma } from '@charmverse/core/prisma-client';
import { isTruthy } from '@packages/lib/utils/types';

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

  const pages = await prisma.page.findMany({
    where: {
      id: {
        in: customNotifications
          .map((notification) => (notification.content as { pageId?: string })?.pageId)
          .filter(isTruthy)
      }
    },
    select: {
      id: true,
      title: true
    }
  });

  const pagesRecord = pages.reduce<
    Record<
      string,
      {
        id: string;
        title: string;
      }
    >
  >((acc, page) => {
    acc[page.id] = page;
    return acc;
  }, {});

  return customNotifications.map((notification) => {
    const pageId = (notification.content as { pageId?: string })?.pageId;
    const page = pageId ? pagesRecord[pageId] : undefined;
    const customNotification = {
      archived: !!notification.notificationMetadata.archivedAt,
      content: notification.content,
      createdAt: notification.notificationMetadata.createdAt.toISOString(),
      id: notification.id,
      createdBy: notification.notificationMetadata.author,
      group: 'custom',
      pageTitle: page?.title ?? '',
      read: !!notification.notificationMetadata.seenAt,
      spaceDomain: notification.notificationMetadata.space.domain,
      spaceId: notification.notificationMetadata.spaceId,
      spaceName: notification.notificationMetadata.space.name,
      type: notification.type
    } as CustomNotification;

    return customNotification;
  });
}
