/* eslint-disable no-continue */
import { prisma } from '@charmverse/core/prisma-client';

import { getPostCategoriesUsersRecord } from 'lib/forums/categories/getPostCategoriesUsersRecord';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import { extractPollIds } from 'lib/prosemirror/extractPollIds';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { WebhookEvent } from 'lib/webhookPublisher/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import { saveDocumentNotification, savePollNotification, savePostNotification } from '../saveNotification';

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
      const extractedMentions = extractMentions(post.content as PageContent);
      const postCategoriesUsersRecords = Object.values(postCategoriesUsersRecord);
      const pollIds = extractPollIds(post.content as PageContent);

      for (const postCategoriesUserRecord of postCategoriesUsersRecords) {
        const userId = postCategoriesUserRecord.userId;
        const postCategoryPermission = postCategoriesUserRecord.visiblePostCategories.find(
          (postCategory) => postCategory.id === post.category.id
        );
        if (
          userId !== postAuthorId &&
          postCategoryPermission &&
          postCategoriesUserRecord.subscriptions[post.category.id]
        ) {
          const userMentions = extractedMentions.filter((mention) => mention.value === userId);
          const { id } = await savePostNotification({
            createdAt: webhookData.createdAt,
            createdBy: postAuthorId,
            postId,
            spaceId,
            userId,
            type: 'created'
          });
          ids.push(id);

          for (const userMention of userMentions) {
            const { id: _id } = await saveDocumentNotification({
              createdAt: webhookData.createdAt,
              createdBy: postAuthorId,
              mentionId: userMention.id,
              postId,
              spaceId,
              userId: userMention.value,
              type: 'mention.created',
              content: userMention.parentNode
            });
            ids.push(id);
          }

          if (postCategoryPermission.permissions.comment_posts) {
            for (const pollId of pollIds) {
              const { id: _id } = await savePollNotification({
                createdAt: webhookData.createdAt,
                createdBy: postAuthorId,
                spaceId,
                type: 'new_vote',
                userId,
                voteId: pollId
              });
              ids.push(id);
            }
          }
        }
      }

      break;
    }

    default:
      break;
  }
  return ids;
}
