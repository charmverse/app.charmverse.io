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
      const notificationMetadata = notification.notificationMetadata;

      const forumNotification = {
        taskId: notification.id,
        commentId: notification.commentId,
        commentText: notification.comment?.contentText ?? '',
        createdAt: notificationMetadata.createdAt.toISOString(),
        createdBy: notificationMetadata.author,
        mentionId: notification.mentionId,
        postId: notification.postId,
        postPath: notification.post.path,
        postTitle: notification.post.title,
        spaceDomain: notificationMetadata.space.domain,
        spaceId: notificationMetadata.spaceId,
        spaceName: notificationMetadata.space.name,
        type: notification.type as ForumNotification['type'],
        group: 'post',
        archived: notificationMetadata.archivedAt,
        read: !!notificationMetadata.seenAt
      } as ForumNotification;

      if (notificationMetadata.seenAt) {
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
