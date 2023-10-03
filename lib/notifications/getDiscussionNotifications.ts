import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { DiscussionNotification, NotificationsGroup } from './interfaces';
import { notificationMetadataIncludeStatement, sortByDate } from './utils';

export async function getDiscussionNotifications(userId: string): Promise<NotificationsGroup<DiscussionNotification>> {
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

  const discussionNotificationsGroup: NotificationsGroup<DiscussionNotification> = {
    marked: [],
    unmarked: []
  };

  [...documentNotifications, ...cardNotifications].forEach((notification) => {
    const notificationMetadata = notification.notificationMetadata;
    const page = ('card' in notification ? notification.card.page : notification.page) as Page;
    const blockCommentId = 'card' in notification ? notification.blockCommentId : null;
    const personPropertyId = 'card' in notification ? notification.personPropertyId : null;
    const inlineCommentId = 'inlineCommentId' in notification ? notification.inlineCommentId : null;
    const mentionId = 'mentionId' in notification ? notification.mentionId : null;
    const discussionNotification = {
      id: notification.id,
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
      type: notification.type,
      blockCommentId,
      personPropertyId,
      marked: !!notificationMetadata.seenAt
    } as DiscussionNotification;

    if (notification.notificationMetadata.seenAt) {
      discussionNotificationsGroup.marked.push(discussionNotification);
    } else {
      discussionNotificationsGroup.unmarked.push(discussionNotification);
    }
  });

  return {
    marked: discussionNotificationsGroup.marked.sort(sortByDate),
    unmarked: discussionNotificationsGroup.unmarked.sort(sortByDate)
  };
}
