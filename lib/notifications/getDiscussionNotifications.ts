import { prisma } from '@charmverse/core/prisma-client';

import type { DiscussionNotification, NotificationsGroup } from './interfaces';
import { notificationMetadataIncludeStatement, sortByDate } from './utils';

export async function getDiscussionNotifications(userId: string): Promise<NotificationsGroup<DiscussionNotification>> {
  const pageNotifications = await prisma.pageNotification.findMany({
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

  const discussionNotificationsGroup: NotificationsGroup<DiscussionNotification> = {
    marked: [],
    unmarked: []
  };

  pageNotifications.forEach((notification) => {
    const notificationMetadata = notification.notificationMetadata;
    const page = notification.page;
    const discussionNotification = {
      id: notification.id,
      bountyId: page.bountyId,
      bountyTitle: page.title || 'Untitled',
      commentId: notification.commentId,
      inlineCommentId: notification.inlineCommentId,
      mentionId: notification.mentionId,
      createdAt: notificationMetadata.createdAt.toISOString(),
      createdBy: notificationMetadata.user,
      pageId: notification.pageId,
      pagePath: page.path,
      pageTitle: page.title || 'Untitled',
      spaceDomain: notificationMetadata.space.domain,
      spaceId: notificationMetadata.spaceId,
      spaceName: notificationMetadata.space.name,
      pageType: page.type,
      text: '',
      type: notification.type
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
