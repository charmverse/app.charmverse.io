/* eslint-disable no-continue */
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import type { UserMentionMetadata } from 'lib/prosemirror/extractMentions';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { WebhookEvent } from 'lib/webhookPublisher/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import { saveDocumentNotification } from '../saveNotification';

async function createDocumentNotificationsFromMention({
  targetMention,
  mentionAuthorId,
  createdAt,
  spaceId,
  pageId,
  postId
}: {
  createdAt: string;
  spaceId: string;
  targetMention: UserMentionMetadata;
  mentionAuthorId: string;
  pageId?: string;
  postId?: string;
}) {
  const targetUserIds: string[] = [];
  const notificationIds: string[] = [];

  if (targetMention.type === 'role') {
    const role = await prisma.role.findFirstOrThrow({
      where: {
        id: targetMention.value
      },
      select: {
        spaceRolesToRole: {
          select: {
            spaceRole: {
              select: {
                user: {
                  select: {
                    id: true
                  }
                }
              }
            }
          }
        }
      }
    });
    role.spaceRolesToRole.forEach((spaceRole) => {
      if (spaceRole.spaceRole.user.id !== mentionAuthorId) {
        targetUserIds.push(spaceRole.spaceRole.user.id);
      }
    });
  }

  if (targetMention.type === 'user' && targetMention.value !== mentionAuthorId) {
    targetUserIds.push(targetMention.value);
  }

  for (const targetUserId of targetUserIds) {
    const { id } = await saveDocumentNotification({
      type: 'mention.created',
      createdAt,
      createdBy: mentionAuthorId,
      mentionId: targetMention.id,
      pageId,
      postId,
      spaceId,
      userId: targetUserId,
      content: targetMention.parentNode ?? null
    });
    notificationIds.push(id);
  }

  return notificationIds;
}

export async function createDocumentNotifications(webhookData: {
  createdAt: string;
  event: WebhookEvent;
  spaceId: string;
}): Promise<string[]> {
  const ids: string[] = [];
  switch (webhookData.event.scope) {
    case WebhookEventNames.DocumentMentionCreated: {
      const mentionId = webhookData.event.mention.id;
      const mentionAuthorId = webhookData.event.user.id;
      const pageId = webhookData.event.document?.id;
      const postId = webhookData.event.post?.id;

      let targetMention: UserMentionMetadata | undefined;

      if (webhookData.event.document) {
        const document = await prisma.page.findUniqueOrThrow({
          where: {
            id: pageId
          },
          select: {
            content: true
          }
        });
        const documentContent = document.content as PageContent;
        targetMention = extractMentions(documentContent).find((mention) => mention.id === mentionId);
      } else if (webhookData.event.post) {
        const post = await prisma.post.findUniqueOrThrow({
          where: {
            id: postId
          },
          select: {
            content: true
          }
        });
        const postContent = post.content as PageContent;
        targetMention = extractMentions(postContent).find((mention) => mention.id === mentionId);
      }

      if (!targetMention) {
        log.warn('Ignore user mention - could not find it in the doc', {
          pageId,
          postId,
          mentionAuthorId,
          targetMention
        });
        break;
      }

      const notificationIds = await createDocumentNotificationsFromMention({
        targetMention,
        mentionAuthorId,
        createdAt: webhookData.createdAt,
        spaceId: webhookData.spaceId,
        pageId,
        postId
      });

      notificationIds.forEach((id) => ids.push(id));
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
        const { id } = await saveDocumentNotification({
          type: 'inline_comment.replied',
          createdAt: webhookData.createdAt,
          createdBy: inlineCommentAuthorId,
          inlineCommentId,
          pageId,
          spaceId,
          userId: previousInlineComment.userId,
          content: inlineCommentContent
        });
        ids.push(id);
      }

      for (const authorId of authorIds) {
        if (inlineCommentAuthorId !== authorId && previousInlineComment?.userId !== authorId) {
          const { id } = await saveDocumentNotification({
            type: 'inline_comment.created',
            createdAt: webhookData.createdAt,
            createdBy: inlineCommentAuthorId,
            inlineCommentId,
            pageId,
            spaceId,
            userId: authorId,
            content: inlineCommentContent
          });
          ids.push(id);
        }
      }

      const extractedMentions = extractMentions(inlineCommentContent);
      for (const extractedMention of extractedMentions) {
        const notifications = await createDocumentNotificationsFromMention({
          targetMention: extractedMention,
          mentionAuthorId: inlineCommentAuthorId,
          createdAt: webhookData.createdAt,
          spaceId: webhookData.spaceId,
          pageId
        });

        notifications.forEach((id) => ids.push(id));
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
            const { id } = await saveDocumentNotification({
              type: 'comment.created',
              createdAt: webhookData.createdAt,
              createdBy: commentAuthorId,
              commentId,
              pageId: documentId,
              postId,
              spaceId,
              pageCommentId: documentId ? commentId : undefined,
              postCommentId: postId ? commentId : undefined,
              userId: authorId,
              content: comment.content
            });
            ids.push(id);
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
          const { id } = await saveDocumentNotification({
            type: 'comment.replied',
            createdAt: webhookData.createdAt,
            createdBy: commentAuthorId,
            commentId,
            pageId: documentId,
            postId,
            spaceId,
            pageCommentId: documentId ? commentId : undefined,
            postCommentId: postId ? commentId : undefined,
            userId: parentCommentAuthorId,
            content: comment.content
          });
          ids.push(id);
        }
      }

      const commentContent = comment.content as PageContent;

      const extractedMentions = extractMentions(commentContent);
      for (const extractedMention of extractedMentions) {
        const notificationIds = await createDocumentNotificationsFromMention({
          targetMention: extractedMention,
          mentionAuthorId: commentAuthorId,
          createdAt: webhookData.createdAt,
          spaceId: webhookData.spaceId,
          pageId: documentId,
          postId
        });

        notificationIds.forEach((id) => ids.push(id));
      }

      break;
    }

    default:
      break;
  }
  return ids;
}
