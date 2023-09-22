import { prisma } from '@charmverse/core/prisma-client';

import type { TaskUser } from 'lib/discussion/interfaces';

export type ForumNotification = {
  taskId: string;
  taskType: 'post.created' | 'post.comment.created' | 'post.mention.created' | 'post.comment.mention.created';
  spaceId: string;
  spaceDomain: string;
  spaceName: string;
  postId: string;
  postPath: string;
  postTitle: string;
  createdAt: string;
  commentId: string | null;
  mentionId: string | null;
  commentText: string;
  createdBy: TaskUser | null;
};

export type ForumNotificationsGroup = {
  marked: ForumNotification[];
  unmarked: ForumNotification[];
};

export async function getForumNotifications(userId: string): Promise<ForumNotificationsGroup> {
  const postNotifications = await prisma.postNotification.findMany({
    where: {
      notificationMetadata: {
        userId
      }
    },
    include: {
      post: true,
      comment: true,
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

  const forumNotificationsGroup: ForumNotificationsGroup = {
    marked: [],
    unmarked: []
  };

  postNotifications.forEach((notification) => {
    const forumNotification: ForumNotification = {
      taskId: notification.id,
      commentId: notification.commentId,
      commentText: notification.comment?.contentText ?? '',
      createdAt: notification.notificationMetadata.createdAt.toISOString(),
      createdBy: notification.notificationMetadata.user,
      mentionId: notification.mentionId,
      postId: notification.postId,
      postPath: notification.post.path,
      postTitle: notification.post.title,
      spaceDomain: notification.notificationMetadata.space.domain,
      spaceId: notification.notificationMetadata.spaceId,
      spaceName: notification.notificationMetadata.space.name,
      taskType: notification.type as ForumNotification['taskType']
    };

    if (notification.notificationMetadata.seenAt) {
      forumNotificationsGroup.marked.push(forumNotification);
    } else {
      forumNotificationsGroup.unmarked.push(forumNotification);
    }
  });

  return {
    marked: forumNotificationsGroup.marked.sort(sortByDate),
    unmarked: forumNotificationsGroup.unmarked.sort(sortByDate)
  };
}

// utils

function sortByDate<T extends { createdAt: string }>(a: T, b: T): number {
  return a.createdAt > b.createdAt ? -1 : 1;
}
