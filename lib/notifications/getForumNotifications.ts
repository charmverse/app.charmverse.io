import { prisma } from '@charmverse/core/prisma-client';

import type { NotificationsGroup, ForumNotification } from './interfaces';
import { notificationMetadataIncludeStatement, sortByDate } from './utils';

export async function getForumNotifications(userId: string): Promise<NotificationsGroup<ForumNotification>> {
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
      notificationMetadata: {
        include: notificationMetadataIncludeStatement
      }
    }
  });

  const postNotificationsGroup: NotificationsGroup<ForumNotification> = {
    marked: [],
    unmarked: []
  };

  postNotifications.forEach((notification) => {
    const postNotification = {
      taskId: notification.id,
      createdAt: notification.notificationMetadata.createdAt.toISOString(),
      createdBy: notification.notificationMetadata.author,
      postId: notification.postId,
      postPath: notification.post.path,
      postTitle: notification.post.title,
      spaceDomain: notification.notificationMetadata.space.domain,
      spaceId: notification.notificationMetadata.spaceId,
      spaceName: notification.notificationMetadata.space.name,
      type: notification.type as ForumNotification['type']
    } as ForumNotification;

    if (notification.notificationMetadata.seenAt) {
      postNotificationsGroup.marked.push(postNotification);
    } else {
      postNotificationsGroup.unmarked.push(postNotification);
    }
  });

  return {
    marked: postNotificationsGroup.marked.sort(sortByDate),
    unmarked: postNotificationsGroup.unmarked.sort(sortByDate)
  };
}
