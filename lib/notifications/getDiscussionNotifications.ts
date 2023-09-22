import { prisma } from '@charmverse/core/prisma-client';

import type { DiscussionNotification, NotificationsGroup } from './interfaces';
import { notificationMetadataIncludeStatement, sortByDate } from './utils';

export async function getDiscussionNotifications(userId: string): Promise<NotificationsGroup<DiscussionNotification>> {
  const pageNotifications = await prisma.pageNotification.findMany({
    where: {
      notificationMetadata: {
        userId
      },
      // Proposal discussion notifications will be handled in getProposalNotifications
      page: {
        type: {
          not: 'proposal'
        }
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
    const discussionNotification = {
      taskId: notification.id,
      bountyId: notification.page.bountyId,
      bountyTitle: notification.page.title || 'Untitled',
      commentId: notification.commentId,
      inlineCommentId: notification.inlineCommentId,
      mentionId: notification.mentionId,
      createdAt: notification.notificationMetadata.createdAt.toISOString(),
      createdBy: notification.notificationMetadata.user,
      pageId: notification.pageId,
      pagePath: notification.page.path,
      pageTitle: notification.page.title || 'Untitled',
      spaceDomain: notification.notificationMetadata.space.domain,
      spaceId: notification.notificationMetadata.spaceId,
      spaceName: notification.notificationMetadata.space.name,
      type: notification.page.bountyId ? 'bounty' : 'page',
      text: '',
      taskType: notification.type
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
