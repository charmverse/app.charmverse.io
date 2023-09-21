import type { Post } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { getPostCategoriesUsersRecord } from './getPostCategoriesUsersRecord';

export async function createPostNotifications({ post }: { post: Post }) {
  const spaceId = post.spaceId;

  const postCategoriesUsersRecord = await getPostCategoriesUsersRecord({
    spaceId
  });

  const extractedMentions = extractMentions(post.content as PageContent);
  const postCategoriesUsersRecords = Object.values(postCategoriesUsersRecord);

  for (const postCategoriesUserRecord of postCategoriesUsersRecords) {
    const userId = postCategoriesUserRecord.userId;
    const userMentions = extractedMentions.filter((mention) => mention.value === userId);
    if (
      postCategoriesUserRecord.visibleCategoryIds.includes(post.categoryId) &&
      postCategoriesUserRecord.subscriptions[post.categoryId]
    ) {
      await prisma.postNotification.create({
        data: {
          type: 'post.created',
          id: v4(),
          notificationMetadata: {
            create: {
              createdBy: post.createdBy,
              spaceId,
              userId
            }
          },
          post: {
            connect: {
              id: post.id
            }
          }
        }
      });

      for (const userMention of userMentions) {
        await prisma.postNotification.create({
          data: {
            type: 'post.mention.created',
            id: v4(),
            mentionId: userMention.id,
            notificationMetadata: {
              create: {
                createdBy: post.createdBy,
                spaceId,
                userId
              }
            },
            post: {
              connect: {
                id: post.id
              }
            }
          }
        });
      }
    }
  }
}
