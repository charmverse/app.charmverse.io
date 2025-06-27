/**
 * Below methods are the API reference links for the Docusign API
 */

import { prisma } from '@charmverse/core/prisma-client';
import { GET } from '@packages/adapters/http';
import { redisClient } from '@packages/adapters/redis/redisClient';
import { log } from '@packages/core/log';

import type { RequiredDocusignCredentials } from './constants';
import { docusignPeriodBetweenRequestsInSeconds } from './constants';
import { getSpaceDocusignCredentials } from './getSpaceDocusignCredentials';
import { docusignUserOAuthTokenHeader } from './headers';

export type DocusignRecipient = {
  creationReason: string;
  isBulkRecipient: boolean;
  recipientSuppliesTabs: boolean;
  requireUploadSignature: boolean;
  name: string;
  email: string;
  recipientId: string;
  recipientIdGuid: string;
  requireIdLookup: boolean;
  userId: string;
  routingOrder: string;
  roleName: string;
  status: string;
  completedCount: string;
  embeddedRecipientStartURL?: string;
  signedDateTime: string;
  sentDateTime: string;
  deliveryMethod: string;
  recipientType: string;
  clientUserId?: string;
};

/**
 * @docs https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopes/get/#schema_200_envelope_envelope_status
 */
type DocuSignEnvelopeStatus = 'completed' | 'created' | 'declined' | 'delivered' | 'sent' | 'signed' | 'voided';

export type DocusignEnvelope = {
  // See these docs for status values
  status: DocuSignEnvelopeStatus;
  documentsUri: string;
  recipientsUri: string;
  attachmentsUri: string;
  envelopeUri: string;
  emailSubject: string;
  envelopeId: string;
  signingLocation: string;
  customFieldsUri: string;
  notificationUri: string;
  enableWetSign: boolean;
  allowMarkup: boolean;
  allowReassign: boolean;
  createdDateTime: string;
  lastModifiedDateTime: string;
  initialSentDateTime: string;
  sentDateTime: string;
  statusChangedDateTime: string;
  documentsCombinedUri: string;
  certificateUri: string;
  templatesUri: string;
  expireEnabled: boolean;
  expireDateTime: string;
  expireAfter: string;
  sender: {
    userName: string;
    userId: string;
    accountId: string;
    email: string;
    ipAddress: string;
  };
  purgeState: string;
  envelopeIdStamping: boolean;
  is21CFRPart11: boolean;
  signerCanSignOnMobile: boolean;
  autoNavigation: boolean;
  isSignatureProviderEnvelope: boolean;
  hasFormDataChanged: boolean;
  allowComments: boolean;
  hasComments: boolean;
  allowViewHistory: boolean;
  envelopeMetadata: {
    allowAdvancedCorrect: boolean;
    enableSignWithNotary: boolean;
    allowCorrect: boolean;
  };
  anySigner: null;
  envelopeLocation: string;
  isDynamicEnvelope: boolean;
  burnDefaultTabData: boolean;
  recipients: { signers: DocusignRecipient[] };
};

function getDocusignEnvelopeCacheKey(envelopeId: string) {
  return `docusign-envelope-${envelopeId}`;
}

export async function setEnvelopeInCache(envelope: DocusignEnvelope): Promise<void> {
  await redisClient?.set(getDocusignEnvelopeCacheKey(envelope.envelopeId), JSON.stringify(envelope), {
    EX: docusignPeriodBetweenRequestsInSeconds
  });
}

export async function getEnvelope({
  credentials,
  envelopeId
}: {
  envelopeId: string;
  credentials: RequiredDocusignCredentials;
}): Promise<DocusignEnvelope> {
  const envelope = await redisClient?.get(getDocusignEnvelopeCacheKey(envelopeId));

  if (envelope) {
    log.info('Envelope found in cache');
    return JSON.parse(envelope);
  }

  const envelopeFromDocusign = await GET<DocusignEnvelope>(
    `${credentials.docusignApiBaseUrl}/restapi/v2.1/accounts/${credentials.docusignAccountId}/envelopes/${envelopeId}`,
    { include: 'recipients' },
    {
      headers: docusignUserOAuthTokenHeader({ accessToken: credentials.accessToken })
    }
  );

  await setEnvelopeInCache(envelopeFromDocusign);

  await redisClient?.set(`docusign-envelope-${envelopeId}`, JSON.stringify(envelopeFromDocusign), {
    EX: docusignPeriodBetweenRequestsInSeconds
  });

  return envelopeFromDocusign;
}

export async function listSpaceEnvelopes({ spaceId }: { spaceId: string }): Promise<DocusignEnvelope[]> {
  const envelopes = await prisma.documentToSign.findMany({
    where: { spaceId }
  });

  const creds = await getSpaceDocusignCredentials({ spaceId });

  const envelopeData = await Promise.all(
    envelopes.map((e) =>
      getEnvelope({
        envelopeId: e.docusignEnvelopeId,
        credentials: creds
      })
    )
  );

  return envelopeData;
}

export type DocusignSearchParams = {
  title?: string;
};

export type DocusignEnvelopeLite = Pick<DocusignEnvelope, 'envelopeId' | 'emailSubject'> & {
  recipients: {
    signers: Pick<DocusignRecipient, 'name' | 'email' | 'status'>[];
  };
  sender: {
    email: string;
  };
};

function envelopeToLiteEnvelope(envelope: DocusignEnvelope): DocusignEnvelopeLite {
  return {
    envelopeId: envelope.envelopeId,
    emailSubject: envelope.emailSubject,
    recipients: {
      signers: envelope.recipients.signers.map((signer) => ({
        name: signer.name,
        email: signer.email,
        status: signer.status
      }))
    },
    sender: {
      email: envelope.sender.email
    }
  };
}

/**
 * https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopes/liststatuschanges/
 */
export async function searchDocusignDocs({
  query,
  spaceId
}: {
  query: DocusignSearchParams;
  spaceId: string;
}): Promise<DocusignEnvelopeLite[]> {
  const searchResultsKey = `docusign-search-${JSON.stringify({ ...query, spaceId })}`;

  const cachedResults = await redisClient?.get(`docusign-search-${searchResultsKey}`);

  if (cachedResults) {
    return JSON.parse(cachedResults).map(envelopeToLiteEnvelope);
  }

  const spaceCreds = await getSpaceDocusignCredentials({ spaceId });

  const apiUrl = `${spaceCreds.docusignApiBaseUrl}/restapi/v2.1/accounts/${spaceCreds.docusignAccountId}/envelopes`;

  const result = await GET<{ envelopes: DocusignEnvelope[] }>(
    apiUrl,
    { search_text: query.title, from_date: new Date('2021-01-01').toISOString(), include: 'recipients' },
    {
      headers: docusignUserOAuthTokenHeader({ accessToken: spaceCreds.accessToken })
    }
  );

  const envelopes = result.envelopes ?? [];

  await redisClient?.set(searchResultsKey, JSON.stringify(envelopes), { EX: 60 * 16 });

  return envelopes.map(envelopeToLiteEnvelope);
}
