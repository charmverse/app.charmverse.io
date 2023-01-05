import type { Context, SQSEvent, SQSHandler } from 'aws-lambda';

import type { WebhookPayload } from './interfaces';

/**
 * SQS worker logic goes there
 */
export const webhookWorker: SQSHandler = async (event: SQSEvent, context: Context) => {
  try {
    // SQS may be invoked with multiple messages
    for (const message of event.Records) {
      const payload = JSON.parse(message.body) as WebhookPayload;

      // Gets message information
      // Connect to DB (with prisma) and get space's webhook config
      // Sign message and add it to header
      // Trigger HTTP call using space's setting
      // Expects 200 back
    }
  } catch (err: unknown) {
    // TODO: make sure we need to retry or not there
    return {
      batchItemFailures: []
    };
  }
};
