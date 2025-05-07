/* eslint-disable no-continue */
import { prisma } from '@charmverse/core/prisma-client';
import { getPostCategoriesUsersRecord } from '@packages/lib/forums/categories/getPostCategoriesUsersRecord';
import type { WebhookEvent } from '@packages/lib/webhookPublisher/interfaces';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';

import { savePostNotification } from '../saveNotification';

export async function createForumNotifications(webhookData: {
  createdAt: string;
  event: WebhookEvent;
  spaceId: string;
}): Promise<string[]> {
  const ids: string[] = [];
  switch (webhookData.event.scope) {
    case WebhookEventNames.ForumPostCreated: {
      const spaceId = webhookData.spaceId;
      const postId = webhookData.event.post.id;
      const post = await prisma.post.findFirstOrThrow({
        where: {
          id: postId
        },
        select: {
          category: {
            select: {
              id: true
            }
          },
          author: {
            select: {
              id: true
            }
          },
          content: true,
          id: true
        }
      });
      const postAuthorId = post.author.id;
      const postCategoriesUsersRecord = await getPostCategoriesUsersRecord({
        spaceId
      });
      const postCategoriesUsersRecords = Object.values(postCategoriesUsersRecord);

      for (const postCategoriesUserRecord of postCategoriesUsersRecords) {
        const userId = postCategoriesUserRecord.userId;
        const postCategoryPermission = postCategoriesUserRecord.visiblePostCategories.find(
          (postCategory) => postCategory.id === post.category.id
        );
        if (
          userId !== postAuthorId &&
          postCategoryPermission?.permissions.view_posts &&
          postCategoriesUserRecord.subscriptions[post.category.id]
        ) {
          const { id } = await savePostNotification({
            createdAt: webhookData.createdAt,
            createdBy: postAuthorId,
            postId,
            spaceId,
            userId,
            type: 'created'
          });
          ids.push(id);
        }
      }

      break;
    }

    default:
      break;
  }
  return ids;
}
