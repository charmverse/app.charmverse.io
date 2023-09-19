import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { SQSBatchItemFailure, SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';

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
          case WebhookEventNames.PageMention: {
            const mentionedUserId = webhookData.event.mention.value;
            const eventId = webhookData.id;
            await prisma.pageNotification.upsert({
              create: {
                page: {
                  connect: {
                    id: webhookData.event.page.id
                  }
                },
                id: eventId,
                record: {
                  create: {
                    createdBy: mentionedUserId,
                    spaceId: webhookData.spaceId,
                    userId: mentionedUserId
                  }
                },
                mentionId: webhookData.event.mention.id
              },
              update: {},
              where: {
                id: eventId
              }
            });

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
