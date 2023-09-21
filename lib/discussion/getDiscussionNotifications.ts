import type { Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { DiscussionNotification } from './interfaces';

export type DiscussionNotificationsGroup = {
  marked: DiscussionNotification[];
  unmarked: DiscussionNotification[];
};

export type Discussion = Omit<DiscussionNotification, 'createdBy'> & { userId: string };
export type SpaceRecord = Record<string, Pick<Space, 'name' | 'domain' | 'id'>>;

export interface GetDiscussionsResponse {
  mentions: Discussion[];
  discussionUserIds: string[];
  comments: Discussion[];
}

export type GetDiscussionsInput = {
  userId: string;
  username: string;
  spaceIds: string[];
  spaceRecord: SpaceRecord;
};

export async function getDiscussionNotifications(userId: string): Promise<DiscussionNotificationsGroup> {
  const pageNotifications = await prisma.pageNotification.findMany({
    where: {
      notificationMetadata: {
        userId
      },
      mentionId: {
        not: null
      },
      type: {
        in: ['mention.created', 'inline_comment.mention.created', 'inline_comment.created', 'inline_comment.replied']
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
        include: {
          space: {
            select: {
              name: true,
              domain: true
            }
          },
          user: {
            select: {
              id: true,
              username: true,
              path: true,
              avatar: true,
              avatarTokenId: true
            }
          }
        }
      }
    }
  });

  const discussionNotificationsGroup: DiscussionNotificationsGroup = {
    marked: [],
    unmarked: []
  };

  pageNotifications.forEach((notification) => {
    const discussionNotification = {
      taskId: notification.id,
      bountyId: notification.page.bountyId,
      bountyTitle: notification.page.title,
      commentId: notification.commentId,
      mentionId: notification.mentionId,
      createdAt: notification.notificationMetadata.createdAt.toISOString(),
      createdBy: notification.notificationMetadata.user,
      pageId: notification.pageId,
      pagePath: notification.page.path,
      pageTitle: notification.page.title,
      spaceDomain: notification.notificationMetadata.space.domain,
      spaceId: notification.notificationMetadata.spaceId,
      spaceName: notification.notificationMetadata.space.name,
      type: notification.page.type as DiscussionNotification['type'],
      text: '',
      taskType: notification.type
    };

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

// utils
function sortByDate<T extends { createdAt: string | Date }>(a: T, b: T): number {
  return a.createdAt > b.createdAt ? -1 : 1;
}
