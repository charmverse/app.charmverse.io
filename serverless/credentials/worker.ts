import crypto from 'crypto';

import { log } from '@charmverse/core/log';
import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { SQSBatchItemFailure, SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';

import { multiAttestOnchain, type OnChainMultiAttestationInputPayload } from 'lib/credentials/multiAttestOnchain';

/**
 * SQS worker, message are executed one by one
 * Changing comments to trigger deploy
 */
export const credentialsWorker = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  // Store failed messageIDs
  const batchItemFailures: SQSBatchItemFailure[] = [];

  log.debug('Credentials worker initiated.', { recordCount: event.Records.length });

  // Execute messages
  await Promise.allSettled(
    event.Records.map(async (record: SQSRecord) => {
      const body = record.body;

      try {
        // Gets message information
        const credentialData = JSON.parse(body) as OnChainMultiAttestationInputPayload;

        const jsonString = JSON.stringify(credentialData);

        const webhookMessageHash = crypto.createHash('sha256').update(jsonString).digest('hex');

        const webhookMessage = await prisma.sQSMessage.findUnique({
          where: {
            id: webhookMessageHash
          }
        });

        if (webhookMessage) {
          log.warn('SQS message already processed', {
            ...credentialData,
            id: webhookMessageHash,
            spaceId: credentialData.spaceId
          });
          return;
        }

        await prisma.sQSMessage.create({
          data: {
            id: webhookMessageHash,
            payload: credentialData as Prisma.InputJsonObject
          }
        });

        // Create and save notifications

        log.debug('Saved record of SQS message', {
          id: webhookMessageHash,
          credentials: credentialData.credentialInputs,
          spaceId: credentialData.spaceId
        });

        await multiAttestOnchain(credentialData);
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
