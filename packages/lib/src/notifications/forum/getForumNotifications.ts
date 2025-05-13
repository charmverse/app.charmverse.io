import { prisma } from '@charmverse/core/prisma-client';

import type { PostNotification } from '../interfaces';
import type { QueryCondition } from '../utils';
import { notificationMetadataSelectStatement, queryCondition } from '../utils';

export async function getPostNotifications({ id, userId }: QueryCondition): Promise<PostNotification[]> {
  const postNotifications = await prisma.postNotification.findMany({
    where: {
      ...queryCondition({ id, userId }),
      post: {
        deletedAt: null,
        space: {
          spaceRoles: {
            some: {
              userId
            }
          }
        }
      }
    },
    select: {
      id: true,
      type: true,
      postId: true,
      post: {
        select: {
          id: true,
          path: true,
          title: true
        }
      },
      notificationMetadata: {
        select: notificationMetadataSelectStatement
      }
    }
  });

  return postNotifications.map((notification) => {
    const postNotification = {
      id: notification.id,
      createdAt: notification.notificationMetadata.createdAt.toISOString(),
      createdBy: notification.notificationMetadata.author,
      postId: notification.postId,
      postPath: notification.post.path,
      postTitle: notification.post.title,
      spaceDomain: notification.notificationMetadata.space.domain,
      spaceId: notification.notificationMetadata.spaceId,
      spaceName: notification.notificationMetadata.space.name,
      type: notification.type as PostNotification['type'],
      archived: !!notification.notificationMetadata.archivedAt,
      group: 'post',
      read: !!notification.notificationMetadata.seenAt
    } as PostNotification;
    return postNotification;
  });
}
