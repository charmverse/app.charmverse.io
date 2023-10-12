/* eslint-disable no-continue */
import { prisma } from '@charmverse/core/prisma-client';

import { getPostCategoriesUsersRecord } from 'lib/forums/categories/getPostCategoriesUsersRecord';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { WebhookEvent } from 'lib/webhookPublisher/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import { saveDocumentNotification, savePostNotification } from '../saveNotification';

export async function createForumNotifications(webhookData: {
  createdAt: string;
  event: WebhookEvent;
  spaceId: string;
}) {
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
      const extractedMentions = extractMentions(post.content as PageContent);
      const postCategoriesUsersRecords = Object.values(postCategoriesUsersRecord);
      for (const postCategoriesUserRecord of postCategoriesUsersRecords) {
        const userId = postCategoriesUserRecord.userId;
        if (
          userId !== postAuthorId &&
          postCategoriesUserRecord.visibleCategoryIds.includes(post.category.id) &&
          postCategoriesUserRecord.subscriptions[post.category.id]
        ) {
          const userMentions = extractedMentions.filter((mention) => mention.value === userId);
          await savePostNotification({
            createdAt: webhookData.createdAt,
            createdBy: postAuthorId,
            postId,
            spaceId,
            userId,
            type: 'created'
          });

          for (const userMention of userMentions) {
            await saveDocumentNotification({
              createdAt: webhookData.createdAt,
              createdBy: postAuthorId,
              mentionId: userMention.id,
              postId,
              spaceId,
              userId: userMention.value,
              type: 'mention.created',
              content: userMention.parentNode
            });
          }
        }
      }
      break;
    }

    default:
      break;
  }
}
