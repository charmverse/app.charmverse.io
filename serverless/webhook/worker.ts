import crypto from 'crypto';

import { log } from '@charmverse/core/log';
import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { SQSBatchItemFailure, SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';

import { createNotificationsFromEvent } from 'lib/notifications/createNotificationsFromEvent';
import { signJwt } from 'lib/webhookPublisher/authentication';
import type { WebhookPayload } from 'lib/webhookPublisher/interfaces';
import { whiteListedWebhookEvents } from 'lib/webhookPublisher/interfaces';

/**
 * SQS worker, message are executed one by one
 * Changing comments to trigger deploy
 */
export const webhookWorker = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  // Store failed messageIDs
  const batchItemFailures: SQSBatchItemFailure[] = [];

  log.debug('Webhook worker initiated.', { recordCount: event.Records.length });

  // Execute messages
  await Promise.allSettled(
    event.Records.map(async (record: SQSRecord) => {
      const body = record.body;

      try {
        // Gets message information
        const { webhookURL, signingSecret, ...webhookData } = JSON.parse(body) as WebhookPayload;

        const jsonString = JSON.stringify(webhookData);

        const webhookMessageHash = crypto.createHash('sha256').update(jsonString).digest('hex');

        const webhookMessage = await prisma.sQSMessage.findUnique({
          where: {
            id: webhookMessageHash
          }
        });

        if (webhookMessage) {
          log.warn('SQS message already processed', {
            ...webhookData,
            id: webhookMessageHash,
            spaceId: webhookData.spaceId
          });
          return;
        }

        await createNotificationsFromEvent(webhookData);

        await prisma.sQSMessage.create({
          data: {
            id: webhookMessageHash,
            payload: webhookData as Prisma.InputJsonObject
          }
        });

        log.debug('Saved record of SQS message', {
          id: webhookMessageHash,
          scope: webhookData.event.scope,
          spaceId: webhookData.spaceId
        });

        const isWhitelistedEvent = whiteListedWebhookEvents.includes(webhookData.event.scope);

        if (!isWhitelistedEvent) {
          log.debug('Event is not whitelisted for publishing to webhooks', {
            scope: webhookData.event.scope,
            spaceId: webhookData.spaceId
          });
        } else if (webhookURL && signingSecret) {
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

          log.debug('Webhook call response', { ...response, spaceId: webhookData.spaceId });

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
        log.error(`Error in processing SQS message`, { body, error: e, record });

        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    })
  );

  // Return failed events so they can be retried
  return {
    batchItemFailures
  };
};
