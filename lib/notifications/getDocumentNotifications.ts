import type { Page, Post } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { DocumentNotification, NotificationsGroup } from './interfaces';
import { notificationMetadataIncludeStatement, sortByDate } from './utils';

export async function getDocumentNotifications(userId: string): Promise<NotificationsGroup<DocumentNotification>> {
  const documentNotifications = await prisma.documentNotification.findMany({
    where: {
      notificationMetadata: {
        userId
      }
    },
    include: {
      page: {
        select: {
          id: true,
          path: true,
          type: true,
          title: true
        }
      },
      post: {
        select: {
          id: true,
          path: true,
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
    const page = notification.post ? { ...notification.post, type: 'post' } : notification.page;
    const inlineCommentId = 'inlineCommentId' in notification ? notification.inlineCommentId : null;
    const mentionId = 'mentionId' in notification ? notification.mentionId : null;
    if (page) {
      const documentNotification = {
        taskId: notification.id,
        inlineCommentId,
        mentionId,
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
        type: notification.type
      } as DocumentNotification;

      if (notification.notificationMetadata.seenAt) {
        documentNotificationsGroup.marked.push(documentNotification);
      } else {
        documentNotificationsGroup.unmarked.push(documentNotification);
      }
    }
  });

  return {
    marked: documentNotificationsGroup.marked.sort(sortByDate),
    unmarked: documentNotificationsGroup.unmarked.sort(sortByDate)
  };
}
