/**
 * Below methods are the API reference links for the Docusign API
 */

import { log } from '@charmverse/core/log';
import type { DocumentToSign } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { GET, POST } from 'adapters/http';
import { redisClient } from 'adapters/redis/redisClient';
import { baseUrl } from 'config/constants';
import { InvalidStateError } from 'lib/middleware';
import { prettyPrint } from 'lib/utils/strings';

import { docusignUserOAuthTokenHeader, getSpaceDocusignCredentials } from './authentication';
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

type DocumentSigner = {
  email: string;
  name: string;
  roleName?: string;
};

export type DocusignEnvelopeToCreate = {
  templateId: string;
  signers: DocumentSigner[];
};

export type CreatedEnvelope = {
  envelopeId: string;
  uri: string;
  statusDateTime: string;
  status: 'created';
};

/**
 * This function cannot be used with the curent version since we are not creating envelopes from CharmVerse
 */
export async function createEnvelope({
  apiBaseUrl,
  accountId,
  authToken,
  templateId,
  signers,
  spaceId
}: DocusignApiRequest & DocusignEnvelopeToCreate & { accountId: string; spaceId: string }): Promise<CreatedEnvelope> {
  const apiUrl = `${apiBaseUrl}/restapi/v2.1/accounts/${accountId}/envelopes`;
  const result = (await POST(
    apiUrl,
    { templateId, templateRoles: signers, status: 'sent' },
    { headers: docusignUserOAuthTokenHeader({ accessToken: authToken }) }
  )) as CreatedEnvelope;

  await prisma.documentToSign.create({
    data: {
      docusignEnvelopeId: result.envelopeId,
      space: { connect: { id: spaceId } }
    }
  });

  return result as any;
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
  sentDateTime: string;
  deliveryMethod: string;
  recipientType: string;
};

export type DocusignEnvelope = {
  status: string;
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

async function getEnvelope({
  apiBaseUrl,
  authToken,
  accountId,
  envelopeId
}: DocusignApiRequest & { accountId: string; envelopeId: string }): Promise<DocusignEnvelope> {
  const envelope = await redisClient?.get(`docusign-envelope-${envelopeId}`);

  if (envelope) {
    log.info('Envelope found in cache');
    return JSON.parse(envelope);
  }

  const envelopeFromDocusign = await GET<DocusignEnvelope>(
    `${apiBaseUrl}/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}`,
    { include: 'recipients' },
    {
      headers: docusignUserOAuthTokenHeader({ accessToken: authToken })
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
        accountId: creds.docusignAccountId,
        apiBaseUrl: creds.docusignApiBaseUrl,
        authToken: creds.accessToken
      })
    )
  );

  return envelopeData;
}

export type DocusignEnvelopeId = {
  docusignEnvelopeId: string;
};

/**
 * @external https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopeviews/createrecipient/
 */
export async function requestEnvelopeSigningLink({
  docusignEnvelopeId,
  spaceId
}: DocusignEnvelopeId & { spaceId: string }) {
  const spaceCreds = await getSpaceDocusignCredentials({ spaceId });

  const docusignEnvelope = await getEnvelope({
    accountId: spaceCreds.docusignAccountId,
    apiBaseUrl: spaceCreds.docusignApiBaseUrl,
    authToken: spaceCreds.accessToken,
    envelopeId: docusignEnvelopeId
  });

  const senderId = docusignEnvelope.sender.userId;

  const recipient = docusignEnvelope.recipients.signers.find((r) => r.userId === senderId);

  prettyPrint({ recipients: docusignEnvelope.recipients.signers, senderId, found: recipient });

  if (!recipient) {
    throw new InvalidStateError('No signer found for envelope');
  }

  const { domain: spaceDomain } = await prisma.space.findUniqueOrThrow({
    where: { id: spaceId },
    select: { domain: true }
  });

  const signerData = {
    returnUrl: `${baseUrl}/${spaceDomain}/sign-docs`,
    authenticationMethod: 'none',
    // userId: recipient.userId,
    recipientId: recipient.recipientId,
    userName: recipient.name,
    email: recipient.email
  };

  prettyPrint({ signerData, spaceCreds, docusignEnvelopeId });

  const apiUrl = `${spaceCreds.docusignApiBaseUrl}/restapi/v2.1/accounts/${spaceCreds.docusignAccountId}/envelopes/${docusignEnvelopeId}/views/recipient`;

  const url = (await POST<{ url: string }>(apiUrl, signerData, {
    headers: docusignUserOAuthTokenHeader({ accessToken: spaceCreds.accessToken })
  })) as { url: string };

  return url.url;
}

export type DocusignSearch = {
  title?: string;
};

/**
 * https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopes/liststatuschanges/
 */
export async function searchDocusignDocs({
  title,
  spaceId
}: DocusignSearch & {
  spaceId: string;
}): Promise<DocusignEnvelope[]> {
  const searchResultsKey = `docusign-search-${JSON.stringify({ title, spaceId })}`;

  const cachedResults = await redisClient?.get(`docusign-search-${searchResultsKey}`);

  if (cachedResults) {
    log.info('Returning cached search results');
    return JSON.parse(cachedResults);
  }

  const spaceCreds = await getSpaceDocusignCredentials({ spaceId });

  const apiUrl = `${spaceCreds.docusignApiBaseUrl}/restapi/v2.1/accounts/${spaceCreds.docusignAccountId}/envelopes`;

  const envelopes = await GET<{ envelopes: DocusignEnvelope[] }>(
    apiUrl,
    { search_text: title, from_date: new Date('2021-01-01').toISOString() },
    {
      headers: docusignUserOAuthTokenHeader({ accessToken: spaceCreds.accessToken })
    }
  );

  await redisClient?.set(searchResultsKey, JSON.stringify(envelopes), { EX: 60 * 16 });

  return envelopes.envelopes;
}
