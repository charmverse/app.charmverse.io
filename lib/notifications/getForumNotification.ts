import { prisma } from '@charmverse/core/prisma-client';

import { getForumTasks } from 'lib/forums/getForumNotifications/getForumTasks';

import type { ForumNotification, NotificationsGroup } from './interfaces';
import { notificationMetadataIncludeStatement, sortByDate, upgradedNotificationUserIds } from './utils';

export async function getForumNotifications(userId: string): Promise<NotificationsGroup<ForumNotification>> {
  if (upgradedNotificationUserIds.includes(userId)) {
    const postNotifications = await prisma.postNotification.findMany({
      where: {
        notificationMetadata: {
          userId
        }
      },
      include: {
        post: {
          select: {
            id: true,
            path: true,
            title: true
          }
        },
        comment: {
          select: {
            id: true,
            contentText: true
          }
        },
        notificationMetadata: {
          include: notificationMetadataIncludeStatement
        }
      }
    });

    const forumNotificationsGroup: NotificationsGroup<ForumNotification> = {
      marked: [],
      unmarked: []
    };

    postNotifications.forEach((notification) => {
      const forumNotification = {
        taskId: notification.id,
        commentId: notification.commentId,
        commentText: notification.comment?.contentText ?? '',
        createdAt: notification.notificationMetadata.createdAt.toISOString(),
        createdBy: notification.notificationMetadata.author,
        mentionId: notification.mentionId,
        postId: notification.postId,
        postPath: notification.post.path,
        postTitle: notification.post.title,
        spaceDomain: notification.notificationMetadata.space.domain,
        spaceId: notification.notificationMetadata.spaceId,
        spaceName: notification.notificationMetadata.space.name,
        type: notification.type as ForumNotification['type']
      } as ForumNotification;

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

  return getForumTasks(userId);
}
