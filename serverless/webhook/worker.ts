import type { SQSBatchItemFailure, SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';
import fetch from 'node-fetch';

import type { WebhookPayload } from './interfaces';

/**
 * SQS worker, message are executed one by one
 */
export const webhookWorker: SQSHandler = async (event: SQSEvent) => {
  // Store failed messageIDs
  const batchItemFailures: SQSBatchItemFailure[] = [];

  // Execute messages
  await Promise.allSettled(
    event.Records.map(async (record: SQSRecord) => {
      const body = record.body;

      try {
        // Gets message information
        const { webhookURL, ...webhookData } = JSON.parse(body) as WebhookPayload;

        // Call their endpoint with the event's data
        const response = await fetch(webhookURL, { method: 'POST', body: JSON.stringify(webhookData) });

        // If not 200 back, we throw an error
        if (response.status !== 200) {
          // Add messageID to failed message array
          batchItemFailures.push({ itemIdentifier: record.messageId });

          // Throw the error so we can log it for debugging
          throw new Error(`Expect error 200 back. Received: ${response.status}`, {
            cause: {
              webhookData,
              status: response.status
            }
          });
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(`Error in processing SQS Worker: ${body}`);

        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    })
  );

  // Return failed events so they can be retried
  return {
    batchItemFailures
  };
};
