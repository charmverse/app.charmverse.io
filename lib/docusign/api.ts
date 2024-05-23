/**
 * Below methods are the API reference links for the Docusign API
 */

import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { GET, POST, PUT } from 'adapters/http';
import { redisClient } from 'adapters/redis/redisClient';
import { baseUrl } from 'config/constants';
import { InvalidStateError } from 'lib/middleware';
import { lowerCaseEqual, prettyPrint } from 'lib/utils/strings';

import { docusignUserOAuthTokenHeader, getSpaceDocusignCredentials } from './authentication';
import type { RequiredDocusignCredentials } from './constants';
import { docusignPeriodBetweenRequestsInSeconds } from './constants';

type DocusignApiRequest = {
  authToken: string;
  apiBaseUrl: string;
};

export type DocusignTemplate = {
  templateId: string;
  uri: string;
  name: string;
  shared: boolean;
  passwordProtected: boolean;
  description: string;
  created: string;
  lastModified: string;
  lastUsed: string;
  owner: {
    userName: string;
    userId: string;
    email: string;
  };
  pageCount: number;
  folderId: string;
  folderName: string;
  folderIds: string[];
  autoMatch: boolean;
  autoMatchSpecifiedByUser: boolean;
  emailSubject: string;
  emailBlurb: string;
  signingLocation: string;
  authoritativeCopy: boolean;
  enforceSignerVisibility: boolean;
  enableWetSign: boolean;
  allowMarkup: boolean;
  allowReassign: boolean;
  disableResponsiveDocument: boolean;
  anySigner: any; // 'any' type can be replaced with more specific type if known
  envelopeLocation: any; // 'any' type can be replaced with more specific type if known
};

export function getDocusignTemplates({ apiBaseUrl, authToken, accountId }: DocusignApiRequest & { accountId: string }) {
  return GET<DocusignTemplate[]>(`${apiBaseUrl}/restapi/v2.1/accounts/${accountId}/templates`, undefined, {
    headers: docusignUserOAuthTokenHeader({ accessToken: authToken })
  });
}

type DocusignRecipient = {
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

export async function getEnvelope({
  credentials,
  envelopeId
}: {
  envelopeId: string;
  credentials: RequiredDocusignCredentials;
}): Promise<DocusignEnvelope> {
  const envelope = await redisClient?.get(`docusign-envelope-${envelopeId}`);

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

export type DocusignEnvelopeId = {
  docusignEnvelopeId: string;
};

export type DocusignEnvelopeLinkRequest = DocusignEnvelopeId & { spaceId: string; signerEmail: string };

/**
 * @external https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopeviews/createrecipient/
 */
export async function requestEnvelopeSigningLink({
  docusignEnvelopeId,
  spaceId,
  signerEmail
}: DocusignEnvelopeLinkRequest) {
  const spaceCreds = await getSpaceDocusignCredentials({ spaceId });

  const docusignEnvelope = await getEnvelope({
    envelopeId: docusignEnvelopeId,
    credentials: spaceCreds
  });

  const recipient = docusignEnvelope.recipients.signers.find((r) => lowerCaseEqual(r.email, signerEmail));

  if (!recipient) {
    throw new InvalidStateError('No signer found for envelope');
  }

  if (!recipient.clientUserId) {
    throw new InvalidStateError('clientUserId is required for recipient');
  }

  const { domain: spaceDomain } = await prisma.space.findUniqueOrThrow({
    where: { id: spaceId },
    select: { domain: true }
  });

  const signerData = {
    returnUrl: `${baseUrl}/${spaceDomain}`,
    authenticationMethod: 'none',
    // userId: recipient.userId,
    recipientId: recipient.recipientIdGuid,
    userName: recipient.name,
    email: recipient.email,
    clientUserId: recipient.clientUserId
  };

  const apiUrl = `${spaceCreds.docusignApiBaseUrl}/restapi/v2.1/accounts/${spaceCreds.docusignAccountId}/envelopes/${docusignEnvelopeId}/views/recipient`;

  const url = (await POST<{ url: string }>(apiUrl, signerData, {
    headers: docusignUserOAuthTokenHeader({ accessToken: spaceCreds.accessToken })
  })) as { url: string };

  return url.url;
}

export type DocusignSearchParams = {
  title?: string;
};

/**
 * https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopes/liststatuschanges/
 */
export async function searchDocusignDocs({
  query,
  spaceId
}: {
  query: DocusignSearchParams;
  spaceId: string;
}): Promise<DocusignEnvelope[]> {
  const searchResultsKey = `docusign-search-${JSON.stringify({ ...query, spaceId })}`;

  const cachedResults = await redisClient?.get(`docusign-search-${searchResultsKey}`);

  if (cachedResults) {
    log.info('Returning cached search results');
    return JSON.parse(cachedResults);
  }

  const spaceCreds = await getSpaceDocusignCredentials({ spaceId });

  const apiUrl = `${spaceCreds.docusignApiBaseUrl}/restapi/v2.1/accounts/${spaceCreds.docusignAccountId}/envelopes`;

  const envelopes = await GET<{ envelopes: DocusignEnvelope[] }>(
    apiUrl,
    { search_text: query.title, from_date: new Date('2021-01-01').toISOString() },
    {
      headers: docusignUserOAuthTokenHeader({ accessToken: spaceCreds.accessToken })
    }
  );

  await redisClient?.set(searchResultsKey, JSON.stringify(envelopes), { EX: 60 * 16 });

  return envelopes.envelopes;
}

export async function updateRecipients({
  envelopeId,
  spaceId,
  recipients,
  credentials
}: {
  envelopeId: string;
  spaceId?: string;
  recipients: DocusignRecipient[];
  credentials?: RequiredDocusignCredentials;
}) {
  if (!spaceId && !credentials) {
    throw new InvalidInputError('spaceId or credentials are required');
  }

  credentials = credentials ?? (await getSpaceDocusignCredentials({ spaceId: spaceId as string }));

  const apiUrl = `${credentials.docusignApiBaseUrl}/restapi/v2.1/accounts/${credentials.docusignAccountId}/envelopes/${envelopeId}/recipients`;

  const response = await PUT(
    apiUrl,
    { signers: recipients },
    {
      headers: docusignUserOAuthTokenHeader({ accessToken: credentials.accessToken })
    }
  );

  prettyPrint({ updatedEnvelope: response });

  return response;
}
