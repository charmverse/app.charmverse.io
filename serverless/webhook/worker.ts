import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { SQSBatchItemFailure, SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';

import { getPostCategoriesUsersRecord } from 'lib/forums/categories/getPostCategoriesUsersRecord';
import { createPageNotification, createPostNotification } from 'lib/notifications/createNotification';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { signJwt } from 'lib/webhookPublisher/authentication';
import { WebhookEventNames, type WebhookPayload } from 'lib/webhookPublisher/interfaces';

/**
 * SQS worker, message are executed one by one
 */
export const webhookWorker = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  // Store failed messageIDs
  const batchItemFailures: SQSBatchItemFailure[] = [];

  log.debug('Webhook worker initiated');

  // Execute messages
  await Promise.allSettled(
    event.Records.map(async (record: SQSRecord) => {
      const body = record.body;

      try {
        // Gets message information
        const { webhookURL, signingSecret, ...webhookData } = JSON.parse(body) as WebhookPayload;

        switch (webhookData.event.scope) {
          case WebhookEventNames.PageMentionCreated: {
            const mentionedUserId = webhookData.event.mention.value;
            const mentionAuthorId = webhookData.event.user.id;

            await createPageNotification({
              type: 'mention.created',
              createdBy: mentionAuthorId,
              mentionId: webhookData.event.mention.id,
              pageId: webhookData.event.page.id,
              spaceId: webhookData.spaceId,
              userId: mentionedUserId
            });

            break;
          }

          case WebhookEventNames.PageInlineCommentCreated: {
            const pageAuthorId = webhookData.event.page.author.id;
            const pageId = webhookData.event.page.id;
            const spaceId = webhookData.spaceId;
            const inlineCommentId = webhookData.event.inlineComment.id;
            const inlineCommentAuthorId = webhookData.event.inlineComment.author.id;
            const inlineComment = await prisma.comment.findFirstOrThrow({
              where: {
                id: inlineCommentId
              },
              select: {
                content: true,
                threadId: true
              }
            });
            const threadId = inlineComment.threadId;
            const inlineCommentContent = inlineComment.content as PageContent;
            if (inlineCommentAuthorId !== pageAuthorId) {
              await createPageNotification({
                type: 'inline_comment.created',
                createdBy: inlineCommentAuthorId,
                inlineCommentId,
                pageId,
                spaceId,
                userId: pageAuthorId
              });
            }

            const previousInlineComment = await prisma.comment.findFirst({
              where: {
                threadId
              },
              orderBy: {
                createdAt: 'desc'
              },
              skip: 1,
              take: 1,
              select: {
                id: true,
                userId: true
              }
            });

            if (previousInlineComment && previousInlineComment?.id !== inlineCommentId) {
              await createPageNotification({
                type: 'inline_comment.replied',
                createdBy: inlineCommentAuthorId,
                inlineCommentId,
                pageId,
                spaceId,
                userId: previousInlineComment.userId
              });
            }

            const extractedMentions = extractMentions(inlineCommentContent);
            for (const extractedMention of extractedMentions) {
              const mentionedUserId = extractedMention.value;
              if (mentionedUserId !== inlineCommentAuthorId) {
                await createPageNotification({
                  type: 'inline_comment.mention.created',
                  createdBy: inlineCommentAuthorId,
                  inlineCommentId,
                  mentionId: extractedMention.id,
                  pageId,
                  spaceId,
                  userId: mentionedUserId
                });
              }
            }

            break;
          }

          case WebhookEventNames.PageCommentCreated: {
            const pageAuthorId = webhookData.event.page.author.id;
            const pageId = webhookData.event.page.id;
            const spaceId = webhookData.spaceId;
            const commentId = webhookData.event.comment.id;
            const commentAuthorId = webhookData.event.comment.author.id;
            const comment = await prisma.pageComment.findFirstOrThrow({
              where: {
                id: commentId
              },
              select: {
                content: true,
                parentId: true
              }
            });
            const commentParentId = comment.parentId;
            const commentContent = comment.content as PageContent;
            if (commentAuthorId !== pageAuthorId) {
              await createPageNotification({
                type: 'comment.created',
                commentId,
                createdBy: commentAuthorId,
                pageId,
                spaceId,
                userId: pageAuthorId
              });
            }

            if (commentParentId) {
              const parentComment = await prisma.pageComment.findFirstOrThrow({
                where: {
                  parentId: commentParentId
                },
                select: {
                  createdBy: true
                }
              });

              await createPageNotification({
                type: 'comment.replied',
                commentId,
                createdBy: commentAuthorId,
                pageId,
                spaceId,
                userId: parentComment.createdBy
              });
            }

            const extractedMentions = extractMentions(commentContent);
            for (const extractedMention of extractedMentions) {
              const mentionedUserId = extractedMention.value;
              if (mentionedUserId !== commentAuthorId) {
                await createPageNotification({
                  type: 'comment.mention.created',
                  commentId,
                  createdBy: commentAuthorId,
                  mentionId: extractedMention.id,
                  pageId,
                  spaceId,
                  userId: mentionedUserId
                });
              }
            }

            break;
          }

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
              const userMentions = extractedMentions.filter((mention) => mention.value === userId);
              if (
                postCategoriesUserRecord.visibleCategoryIds.includes(post.category.id) &&
                postCategoriesUserRecord.subscriptions[post.category.id]
              ) {
                await createPostNotification({
                  createdBy: postAuthorId,
                  postId,
                  spaceId,
                  userId,
                  type: 'post.created'
                });

                for (const userMention of userMentions) {
                  await createPostNotification({
                    createdBy: post.author.id,
                    mentionId: userMention.id,
                    postId,
                    spaceId,
                    userId,
                    type: 'post.mention.created'
                  });
                }
              }
            }
            break;
          }

          case WebhookEventNames.ForumCommentCreated: {
            const spaceId = webhookData.spaceId;
            const postComment = await prisma.postComment.findFirstOrThrow({
              where: {
                id: webhookData.event.comment.id
              },
              select: {
                parentId: true,
                id: true,
                createdBy: true,
                content: true,
                post: {
                  select: {
                    id: true,
                    createdBy: true
                  }
                }
              }
            });
            const postAuthor = postComment.post.createdBy;
            const postCommentContent = postComment.content as PageContent;
            const postCommentAuthor = postComment.createdBy;
            const postId = postComment.post.id;
            const postCategoriesUsersRecord = await getPostCategoriesUsersRecord({
              spaceId
            });
            const extractedMentions = extractMentions(postCommentContent);
            const postCategoriesUsersRecords = Object.values(postCategoriesUsersRecord);
            for (const postCategoriesUserRecord of postCategoriesUsersRecords) {
              const userMentions = extractedMentions.filter(
                (mention) => mention.value === postCategoriesUserRecord.userId
              );
              for (const userMention of userMentions) {
                await createPostNotification({
                  commentId: postComment.id,
                  createdBy: postComment.createdBy,
                  mentionId: userMention.id,
                  postId,
                  spaceId,
                  userId: postCategoriesUserRecord.userId,
                  type: 'post.comment.mention.created'
                });
              }
            }

            const parentId = postComment.parentId;
            if (!parentId && postCommentAuthor !== postAuthor) {
              await createPostNotification({
                commentId: postComment.id,
                createdBy: postComment.createdBy,
                postId,
                spaceId,
                userId: postAuthor,
                type: 'post.comment.created'
              });
            }

            if (parentId) {
              const parentComment = await prisma.postComment.findUniqueOrThrow({
                where: {
                  id: parentId
                },
                select: {
                  createdBy: true
                }
              });
              const parentCommentAuthor = parentComment.createdBy;
              await createPostNotification({
                commentId: postComment.id,
                createdBy: postComment.createdBy,
                postId,
                spaceId,
                userId: parentCommentAuthor,
                type: 'post.comment.replied'
              });
            }

            break;
          }

          default:
            break;
        }

        if (webhookURL && signingSecret) {
          const secret = Buffer.from(signingSecret, 'hex');

          const signedJWT = await signJwt('webhook', webhookData, secret);

          // Call their endpoint with the event's data
          const response = await fetch(webhookURL, {
            method: 'POST',
            body: JSON.stringify(webhookData),
            headers: {
              Signature: signedJWT
            }
          });

          log.debug('Webhook call response', response);

          // If not 200 back, we throw an error
          if (response.status !== 200) {
            // Add messageID to failed message array
            batchItemFailures.push({ itemIdentifier: record.messageId });

            // Throw the error so we can log it for debugging
            throw new Error(`Expect error 200 back. Received: ${response.status}`);
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        log.error(`Error in processing SQS Worker`, { body, error: e, record });

        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    })
  );

  // Return failed events so they can be retried
  return {
    batchItemFailures
  };
};
