import crypto from 'crypto';

import { log } from '@charmverse/core/log';
import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { count } from '@packages/metrics';
import type { SQSBatchItemFailure, SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';

import { createNotificationsFromEvent } from 'lib/notifications/createNotificationsFromEvent';
import { sendNotificationEmail } from 'lib/notifications/mailer/sendNotificationEmail';
import { type WebhookPayload } from 'lib/webhookPublisher/interfaces';

import { publishToWebhook } from '../webhooks/publisher';

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

        await prisma.sQSMessage.create({
          data: {
            id: webhookMessageHash,
            payload: webhookData as Prisma.InputJsonObject
          }
        });

        // Create and save notifications
        const notifications = await createNotificationsFromEvent(webhookData);

        log.debug('Saved record of SQS message', {
          id: webhookMessageHash,
          notifications: notifications.length,
          scope: webhookData.event.scope,
          spaceId: webhookData.spaceId
        });

        // Send emails
        let notificationCount = 0;
        for (const notification of notifications) {
          const sendResult = await sendNotificationEmail(notification);
          if (sendResult && sendResult.id) {
            await prisma.userNotificationMetadata.update({
              where: {
                id: notification.id
              },
              data: {
                messageId: sendResult.id
              }
            });
            notificationCount += 1;
          }
        }
        if (notificationCount > 0) {
          log.info(`Sent ${notificationCount} email notifications`);
          count('cron.user-notifications.sent', notificationCount);
        }

        await publishToWebhook({ webhookURL, signingSecret, ...webhookData });
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
