/* eslint-disable no-continue */
import { prisma } from '@charmverse/core/prisma-client';

import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { WebhookEvent } from 'lib/webhookPublisher/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import { createDocumentNotification } from '../saveNotification';

export async function createDocumentNotifications(webhookData: {
  createdAt: string;
  event: WebhookEvent;
  spaceId: string;
}) {
  switch (webhookData.event.scope) {
    case WebhookEventNames.DocumentMentionCreated: {
      const mentionedUserId = webhookData.event.mention.value;
      const mentionAuthorId = webhookData.event.user.id;

      if (mentionedUserId !== mentionAuthorId) {
        await createDocumentNotification({
          type: 'mention.created',
          createdBy: mentionAuthorId,
          mentionId: webhookData.event.mention.id,
          pageId: webhookData.event.document.id,
          spaceId: webhookData.spaceId,
          userId: mentionedUserId
        });
      }

      break;
    }

    case WebhookEventNames.DocumentInlineCommentCreated: {
      const data = webhookData.event;
      const spaceId = data.space.id;
      const inlineCommentId = data.inlineComment.id;
      const inlineCommentAuthorId = data.inlineComment.author.id;
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
      const authorIds = data.document.authors.map((author) => author.id);
      const pageId = data.document.id;
      if (
        previousInlineComment &&
        previousInlineComment?.id !== inlineCommentId &&
        previousInlineComment.userId !== inlineCommentAuthorId
      ) {
        await createDocumentNotification({
          type: 'inline_comment.replied',
          createdBy: inlineCommentAuthorId,
          inlineCommentId,
          pageId,
          spaceId,
          userId: previousInlineComment.userId
        });
      }

      for (const authorId of authorIds) {
        if (inlineCommentAuthorId !== authorId && previousInlineComment?.userId !== authorId) {
          await createDocumentNotification({
            type: 'inline_comment.created',
            createdBy: inlineCommentAuthorId,
            inlineCommentId,
            pageId,
            spaceId,
            userId: authorId
          });
        }
      }

      const extractedMentions = extractMentions(inlineCommentContent);
      for (const extractedMention of extractedMentions) {
        const mentionedUserId = extractedMention.value;
        if (mentionedUserId !== inlineCommentAuthorId) {
          await createDocumentNotification({
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

    case WebhookEventNames.DocumentCommentCreated: {
      const spaceId = webhookData.spaceId;
      const commentAuthorId = webhookData.event.comment.author.id;
      const commentId = webhookData.event.comment.id;
      const authorIds = webhookData.event.post
        ? [webhookData.event.post.author.id]
        : webhookData.event.document?.authors.map(({ id }) => id) ?? [];
      const documentId = webhookData.event.document?.id;
      const postId = webhookData.event.post?.id;

      const comment = webhookData.event.post
        ? await prisma.postComment.findFirstOrThrow({
            where: {
              id: commentId
            },
            select: {
              parentId: true,
              content: true
            }
          })
        : await prisma.pageComment.findFirstOrThrow({
            where: {
              id: commentId
            },
            select: {
              parentId: true,
              content: true
            }
          });

      // Send notification only for top-level comments
      if (!comment.parentId) {
        for (const authorId of authorIds) {
          if (authorId !== commentAuthorId) {
            await createDocumentNotification({
              type: 'comment.created',
              createdBy: commentAuthorId,
              commentId,
              pageId: documentId,
              postId,
              spaceId,
              pageCommentId: documentId ? commentId : undefined,
              postCommentId: postId ? commentId : undefined,
              userId: authorId
            });
          }
        }
      } else {
        const parentComment = webhookData.event.post
          ? await prisma.postComment.findUniqueOrThrow({
              where: {
                id: comment.parentId
              },
              select: {
                createdBy: true
              }
            })
          : await prisma.pageComment.findUniqueOrThrow({
              where: {
                id: comment.parentId
              },
              select: {
                createdBy: true
              }
            });

        const parentCommentAuthorId = parentComment.createdBy;
        if (parentCommentAuthorId !== commentAuthorId) {
          await createDocumentNotification({
            type: 'comment.replied',
            createdBy: commentAuthorId,
            commentId,
            pageId: documentId,
            postId,
            spaceId,
            pageCommentId: documentId ? commentId : undefined,
            postCommentId: postId ? commentId : undefined,
            userId: parentCommentAuthorId
          });
        }
      }

      const commentContent = comment.content as PageContent;

      const extractedMentions = extractMentions(commentContent);
      for (const extractedMention of extractedMentions) {
        const mentionedUserId = extractedMention.value;
        await createDocumentNotification({
          type: 'comment.mention.created',
          createdBy: commentAuthorId,
          commentId,
          mentionId: extractedMention.id,
          pageId: documentId,
          postId,
          pageCommentId: documentId ? commentId : undefined,
          postCommentId: postId ? commentId : undefined,
          spaceId,
          userId: mentionedUserId
        });
      }

      break;
    }

    default:
      break;
  }
}
