import { log } from '@charmverse/core/log';
import { v4 as uuid } from 'uuid';

import { DELETE, POST } from 'adapters/http';
import { redisClient } from 'adapters/redis/redisClient';
import { randomIntFromInterval } from 'lib/utils/random';

import type { DocusignEnvelope, DocusignRecipient } from './api';
import { getDocusignEnvelopeCacheKey, getEnvelope } from './api';
import { getSpaceDocusignCredentials } from './authentication';
import { docusignPeriodBetweenRequestsInSeconds, type RequiredDocusignCredentials } from './constants';

const signAtDocusign = 'SIGN_AT_DOCUSIGN';

function deleteRecipient({
  envelopeId,
  recipientId,
  credentials
}: {
  envelopeId: string;
  recipientId: string;
  credentials: RequiredDocusignCredentials;
}) {
  return DELETE(
    `${credentials.docusignApiBaseUrl}/restapi/v2.1/accounts/${credentials.docusignAccountId}/envelopes/${envelopeId}/recipients/${recipientId}`,
    undefined,
    {
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`
      }
    }
  );
}

function createRecipients({
  envelopeId,
  recipients,
  credentials
}: {
  envelopeId: string;
  recipients: DocusignRecipient[];
  credentials: RequiredDocusignCredentials;
}) {
  return POST(
    `${credentials.docusignApiBaseUrl}/restapi/v2.1/accounts/${credentials.docusignAccountId}/envelopes/${envelopeId}/recipients`,
    { signers: recipients },
    {
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`
      }
    }
  );
}

/**
 * Reconfigure the docusign recipients so that we can perform inapp signing or sign from the received email
 */
export async function enableHybridSigning({
  envelopeId,
  credentials,
  spaceId
}: {
  envelopeId: string;
  spaceId?: string;
  credentials?: RequiredDocusignCredentials;
}): Promise<void> {
  credentials = credentials ?? (await getSpaceDocusignCredentials({ spaceId: spaceId as string }));

  const envelope = await getEnvelope({
    envelopeId,
    credentials
  });

  const signers = envelope.recipients.signers;

  const signersToCreate: DocusignRecipient[] = [];

  const signerIdsToDelete: string[] = [];

  for (const signer of signers) {
    if (
      signer.status !== 'completed' &&
      (!signer.clientUserId || signer.embeddedRecipientStartURL !== signAtDocusign)
    ) {
      signerIdsToDelete.push(signer.recipientId);

      signer.clientUserId = uuid();
      signer.embeddedRecipientStartURL = signAtDocusign;
      signer.recipientId = randomIntFromInterval(1000, 9999).toString();

      signersToCreate.push(signer);
    }
  }

  if (signersToCreate.length) {
    log.info('Creating signers');
    await createRecipients({
      envelopeId,
      recipients: signersToCreate,
      credentials
    });
  }

  for (const signerId of signerIdsToDelete) {
    await deleteRecipient({
      envelopeId,
      recipientId: signerId,
      credentials
    });
  }

  const cacheKey = getDocusignEnvelopeCacheKey(envelopeId);

  const newSignerSet = [
    ...signersToCreate,
    ...envelope.recipients.signers.filter(
      (s) => !signersToCreate.some((createdSigner) => createdSigner.recipientId === s.recipientId)
    )
  ];

  // This refresh is necessary since docusign only allows us to fetch an envelope every 15 minutes
  await redisClient?.set(
    cacheKey,
    JSON.stringify({
      ...envelope,
      recipients: { ...envelope.recipients, signers: newSignerSet }
    } as DocusignEnvelope),
    {
      EX: docusignPeriodBetweenRequestsInSeconds
    }
  );
}
