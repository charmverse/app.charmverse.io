import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { CardNotification, NotificationsGroup } from './interfaces';
import { notificationMetadataIncludeStatement, sortByDate, upgradedNotificationUserIds } from './utils';

export async function getCardNotifications(userId: string): Promise<NotificationsGroup<CardNotification>> {
  if (upgradedNotificationUserIds.includes(userId)) {
    const cardNotifications = await prisma.cardNotification.findMany({
      where: {
        notificationMetadata: {
          userId
        }
      },
      include: {
        card: {
          include: {
            page: {
              select: {
                bountyId: true,
                path: true,
                type: true,
                title: true
              }
            }
          }
        },
        notificationMetadata: {
          include: notificationMetadataIncludeStatement
        }
      }
    });

    const cardNotificationsGroup: NotificationsGroup<CardNotification> = {
      marked: [],
      unmarked: []
    };

    cardNotifications.forEach((notification) => {
      const notificationMetadata = notification.notificationMetadata;
      const page = notification.card.page as Page;
      const cardNotification = {
        taskId: notification.id,
        createdAt: notificationMetadata.createdAt.toISOString(),
        createdBy: notificationMetadata.author,
        pageId: page.id,
        pagePath: page.path,
        pageTitle: page.title || 'Untitled',
        spaceDomain: notificationMetadata.space.domain,
        spaceId: notificationMetadata.spaceId,
        spaceName: notificationMetadata.space.name,
        pageType: page.type,
        text: '',
        type: notification.type,
        blockCommentId: notification.blockCommentId,
        personPropertyId: notification.personPropertyId,
        group: 'card',
        archived: !!notificationMetadata.archivedAt,
        read: !!notificationMetadata.seenAt
      } as CardNotification;

      if (notification.notificationMetadata.seenAt) {
        cardNotificationsGroup.marked.push(cardNotification);
      } else {
        cardNotificationsGroup.unmarked.push(cardNotification);
      }
    });

    return {
      marked: cardNotificationsGroup.marked.sort(sortByDate),
      unmarked: cardNotificationsGroup.unmarked.sort(sortByDate)
    };
  }

  return {
    marked: [],
    unmarked: []
  };
}
