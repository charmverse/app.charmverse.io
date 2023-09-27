import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { getDiscussionTasks } from 'lib/discussion/getDiscussionTasks';

import type { DiscussionNotification, NotificationsGroup } from './interfaces';
import { notificationMetadataIncludeStatement, sortByDate } from './utils';

export async function getDiscussionNotifications(userId: string): Promise<NotificationsGroup<DiscussionNotification>> {
  const documentNotifications = await prisma.documentNotification.findMany({
    where: {
      notificationMetadata: {
        userId,
        space: {
          domain: {
            startsWith: 'cvt'
          }
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
    const discussionNotification = {
      taskId: notification.id,
      inlineCommentId: notification.inlineCommentId,
      mentionId: notification.mentionId,
      createdAt: notificationMetadata.createdAt.toISOString(),
      createdBy: notificationMetadata.user,
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
      personPropertyId
    } as DiscussionNotification;

    if (notification.notificationMetadata.seenAt) {
      discussionNotificationsGroup.marked.push(discussionNotification);
    } else {
      discussionNotificationsGroup.unmarked.push(discussionNotification);
    }
  });

  const discussionTasks = await getDiscussionTasks(userId);

  [
    ...discussionTasks.marked.map((d) => ({ ...d, marked: true })),
    ...discussionTasks.unmarked.map((d) => ({ ...d, marked: false }))
  ].forEach((task) => {
    const isMention = task.mentionId !== null;
    const isComment = task.commentId !== null;
    const discussionNotification = {
      taskId: task.taskId,
      inlineCommentId: task.commentId,
      mentionId: task.mentionId,
      createdAt: task.createdAt,
      createdBy: task.createdBy,
      pageId: task.pageId,
      pagePath: task.pagePath,
      pageTitle: task.pageTitle || 'Untitled',
      spaceDomain: task.spaceDomain,
      spaceId: task.spaceId,
      spaceName: task.spaceName,
      pageType: task.type,
      text: '',
      type:
        isMention && isComment
          ? 'inline_comment.mention.created'
          : isMention
          ? 'mention.created'
          : 'inline_comment.created',
      blockCommentId: null,
      personPropertyId: null
    } as DiscussionNotification;

    if (task.marked) {
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
