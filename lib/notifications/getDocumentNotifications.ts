import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { DocumentNotification, NotificationsGroup } from './interfaces';
import { notificationMetadataIncludeStatement, sortByDate, upgradedNotificationUserIds } from './utils';

export async function getDocumentNotifications(userId: string): Promise<NotificationsGroup<DocumentNotification>> {
  if (upgradedNotificationUserIds.includes(userId)) {
    const documentNotifications = await prisma.documentNotification.findMany({
      where: {
        notificationMetadata: {
          userId
        }
      },
      include: {
        page: {
          select: {
            bountyId: true,
            path: true,
            type: true,
            title: true
          }
        },
        notificationMetadata: {
          include: notificationMetadataIncludeStatement
        }
      }
    });

    const documentNotificationsGroup: NotificationsGroup<DocumentNotification> = {
      marked: [],
      unmarked: []
    };

    documentNotifications.forEach((notification) => {
      const notificationMetadata = notification.notificationMetadata;
      const page = notification.page as Page;
      const documentNotification = {
        taskId: notification.id,
        inlineCommentId: notification.inlineCommentId,
        mentionId: notification.mentionId,
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
        group: 'document',
        archived: !!notificationMetadata.archivedAt,
        read: !!notificationMetadata.seenAt
      } as DocumentNotification;

      if (notification.notificationMetadata.seenAt) {
        documentNotificationsGroup.marked.push(documentNotification);
      } else {
        documentNotificationsGroup.unmarked.push(documentNotification);
      }
    });

    return {
      marked: documentNotificationsGroup.marked.sort(sortByDate),
      unmarked: documentNotificationsGroup.unmarked.sort(sortByDate)
    };
  }

  return {
    marked: [],
    unmarked: []
  };
}
