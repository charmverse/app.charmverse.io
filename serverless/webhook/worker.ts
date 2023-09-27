import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { SQSBatchItemFailure, SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';

import { createInlineCommentNotification } from 'lib/notifications/createInlineCommentNotification';
import { createCardNotification, createDocumentNotification } from 'lib/notifications/createNotification';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { signJwt } from 'lib/webhookPublisher/authentication';
import { whiteListedWebhookEvents, WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import type { WebhookEvent, WebhookPayload } from 'lib/webhookPublisher/interfaces';

export async function handleWebhookEvent(webhookData: {
  id: string;
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
      return createInlineCommentNotification(webhookData.event);
    }

    case WebhookEventNames.CardInlineCommentCreated: {
      return createInlineCommentNotification(webhookData.event);
    }

    case WebhookEventNames.CardMentionCreated: {
      const mentionedUserId = webhookData.event.mention.value;
      const mentionAuthorId = webhookData.event.user.id;

      await createCardNotification({
        type: 'mention.created',
        createdBy: mentionAuthorId,
        mentionId: webhookData.event.mention.id,
        cardId: webhookData.event.card.id,
        spaceId: webhookData.spaceId,
        userId: mentionedUserId
      });

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

      if (cardAuthorId !== commentAuthorId) {
        await createCardNotification({
          type: 'block_comment.created',
          createdBy: commentAuthorId,
          cardId,
          spaceId,
          userId: cardAuthorId,
          blockCommentId
        });
      }

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
        personPropertyId: webhookData.event.personPropertyId,
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

        const webhookEventId = webhookData.id;

        const webhookMessage = await prisma.webhookMessage.findUnique({
          where: {
            id: webhookEventId,
            processed: true
          }
        });

        if (webhookMessage) {
          log.debug('Webhook message already processed', { webhookEventId, spaceId: webhookData.spaceId });
          return;
        }

        await prisma.webhookMessage.update({
          where: {
            id: webhookEventId
          },
          data: {
            processed: true
          }
        });

        const isWhitelistedEvent = whiteListedWebhookEvents.includes(webhookData.event.scope);

        if (!isWhitelistedEvent) {
          log.debug('Webhook event not whitelisted', {
            scope: webhookData.event.scope,
            webhookEventId,
            spaceId: webhookData.spaceId
          });
          return;
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
