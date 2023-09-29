import { prisma } from '@charmverse/core/prisma-client';

import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { WebhookEvent } from 'lib/webhookPublisher/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import { createInlineCommentNotification } from './createInlineCommentNotification';
import { createDocumentNotification, createCardNotification } from './createNotification';

export async function createNotificationsFromEvent(webhookData: {
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
      await createInlineCommentNotification(webhookData.event);
      break;
    }

    case WebhookEventNames.CardBlockCommentCreated: {
      const spaceId = webhookData.spaceId;
      const commentAuthorId = webhookData.event.blockComment.author.id;
      const cardId = webhookData.event.card.id;
      const blockCommentId = webhookData.event.blockComment.id;
      const cardAuthorId = webhookData.event.card.author.id;

      const blockComment = await prisma.block.findFirstOrThrow({
        where: {
          id: blockCommentId
        },
        select: {
          parentId: true,
          fields: true
        }
      });

      const blockCommentContent: PageContent = (blockComment.fields as any).content;

      const previousComment = await prisma.block.findFirst({
        where: {
          parentId: blockComment.parentId,
          type: 'comment'
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: 1,
        take: 1,
        select: {
          id: true,
          createdBy: true
        }
      });

      const previousCommentId = previousComment?.id;
      const previousCommentAuthorId = previousComment?.createdBy;

      if (
        previousCommentId &&
        previousCommentAuthorId &&
        previousCommentAuthorId !== commentAuthorId &&
        cardAuthorId !== commentAuthorId
      ) {
        await createCardNotification({
          type: 'block_comment.replied',
          createdBy: commentAuthorId,
          cardId,
          spaceId,
          userId: previousCommentAuthorId,
          blockCommentId
        });
      } else if (cardAuthorId !== commentAuthorId) {
        await createCardNotification({
          type: 'block_comment.created',
          createdBy: commentAuthorId,
          cardId,
          spaceId,
          userId: cardAuthorId,
          blockCommentId
        });
      }

      const extractedMentions = extractMentions(blockCommentContent);

      for (const extractedMention of extractedMentions) {
        const mentionedUserId = extractedMention.value;
        await createCardNotification({
          type: 'block_comment.mention.created',
          createdBy: commentAuthorId,
          cardId,
          mentionId: extractedMention.id,
          spaceId,
          userId: mentionedUserId,
          blockCommentId
        });
      }

      break;
    }

    case WebhookEventNames.CardPersonPropertyAssigned: {
      const spaceId = webhookData.spaceId;
      const assignedUserId = webhookData.event.assignedUser.id;
      const cardId = webhookData.event.card.id;

      await createCardNotification({
        type: 'person_assigned',
        personPropertyId: webhookData.event.personProperty.id,
        cardId,
        spaceId,
        userId: assignedUserId,
        createdBy: webhookData.event.user.id
      });
      break;
    }

    default:
      break;
  }
}
