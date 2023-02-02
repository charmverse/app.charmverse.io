import type { SQSBatchItemFailure, SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';
import type { KeyLike } from 'jose';
import { SignJWT } from 'jose';

import log from 'lib/log';

import type { WebhookPayload } from './interfaces';

const signJwt = (subject: string, payload: Record<string, any>, secret: KeyLike | Uint8Array) => {
  return (
    new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      // subject
      .setSubject(subject)
      .setIssuedAt()
      .setIssuer('https://www.charmverse.io/')
      // change it
      .setExpirationTime('15m')
      .sign(secret)
  );
};

/**
 * SQS worker, message are executed one by one
 */
export const webhookWorker = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  // Store failed messageIDs
  const batchItemFailures: SQSBatchItemFailure[] = [];

  // Execute messages
  await Promise.allSettled(
    event.Records.map(async (record: SQSRecord) => {
      const body = record.body;

      try {
        // Gets message information
        const { webhookURL, signingSecret, ...webhookData } = JSON.parse(body) as WebhookPayload;
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

        // If not 200 back, we throw an error
        if (response.status !== 200) {
          // Add messageID to failed message array
          batchItemFailures.push({ itemIdentifier: record.messageId });

          // Throw the error so we can log it for debugging
          throw new Error(`Expect error 200 back. Received: ${response.status}`);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        log.error(`Error in processing SQS Worker`, { body, record });

        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    })
  );

  // Return failed events so they can be retried
  return {
    batchItemFailures
  };
};
