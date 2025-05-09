// /**
//  * Below methods are the API reference links for the Docusign API
//  */

// import { log } from '@charmverse/core/log';
// import { prisma } from '@charmverse/core/prisma-client';

// import { GET, POST } from '@packages/adapters/http';
// import { redisClient } from '@packages/adapters/redis/redisClient';
// import { baseUrl } from '@packages/config/constants';
// import { InvalidStateError } from '@packages/nextjs/errors';
// import { prettyPrint } from '@packages/utils/strings';

// import { docusignUserOAuthTokenHeader, getSpaceDocusignCredentials } from './authentication';
// import type { RequiredDocusignCredentials } from './constants';
// import { docusignPeriodBetweenRequestsInSeconds } from './constants';

// type DocumentSigner = {
//   email: string;
//   name: string;
//   roleName?: string;
// };

// export type DocusignEnvelopeToCreateFromTemplate = {
//   templateId: string;
//   signers: DocumentSigner[];
//   evaluationId: string;
// };

// export type CreatedEnvelope = {
//   envelopeId: string;
//   uri: string;
//   statusDateTime: string;
//   status: 'created';
// };

// /**
//  * This function cannot be used with the curent version since we are not creating envelopes from CharmVerse
//  */
// export async function createEnvelope({
//   templateId,
//   signers,
//   evaluationId,
//   credentials,
//   spaceId
// }: DocusignEnvelopeToCreateFromTemplate & {
//   evaluationId: string;
//   spaceId: string;
//   credentials?: RequiredDocusignCredentials;
// }): Promise<CreatedEnvelope> {
//   credentials = credentials ?? (await getSpaceDocusignCredentials({ spaceId }));
//   const apiUrl = `${credentials.docusignApiBaseUrl}/restapi/v2.1/accounts/${credentials.docusignAccountId}/envelopes`;
//   const result = (await POST(
//     apiUrl,
//     { templateId, templateRoles: signers, status: 'sent' },
//     { headers: docusignUserOAuthTokenHeader({ accessToken: credentials.accessToken }) }
//   )) as CreatedEnvelope;

//   const evaluation = await prisma.proposalEvaluation.findUniqueOrThrow({
//     where: {
//       id: evaluationId
//     },
//     select: {
//       proposalId: true,
//       proposal: {
//         select: {
//           spaceId: true
//         }
//       }
//     }
//   });

//   await prisma.documentToSign.create({
//     data: {
//       docusignEnvelopeId: result.envelopeId,
//       space: { connect: { id: spaceId } },
//       evaluation: { connect: { id: evaluationId } },
//       proposal: { connect: { id: evaluation.proposalId } }
//     }
//   });

//   return result as any;
// }

// const signAtDocusign = 'SIGN_AT_DOCUSIGN';

// function deleteRecipient({
//   envelopeId,
//   recipientId,
//   credentials
// }: {
//   envelopeId: string;
//   recipientId: string;
//   credentials: RequiredDocusignCredentials;
// }) {
//   return DELETE(
//     `${credentials.docusignApiBaseUrl}/restapi/v2.1/accounts/${credentials.docusignAccountId}/envelopes/${envelopeId}/recipients/${recipientId}`,
//     undefined,
//     {
//       headers: {
//         Authorization: `Bearer ${credentials.accessToken}`
//       }
//     }
//   );
// }

// function createRecipients({
//   envelopeId,
//   recipients,
//   credentials
// }: {
//   envelopeId: string;
//   recipients: DocusignRecipient[];
//   credentials: RequiredDocusignCredentials;
// }) {
//   return POST(
//     `${credentials.docusignApiBaseUrl}/restapi/v2.1/accounts/${credentials.docusignAccountId}/envelopes/${envelopeId}/recipients`,
//     { signers: recipients },
//     {
//       headers: {
//         Authorization: `Bearer ${credentials.accessToken}`
//       }
//     }
//   );
// }

// /**
//  * Reconfigure the docusign recipients so that we can perform inapp signing or sign from the received email
//  */
// export async function enableHybridSigning({
//   envelopeId,
//   credentials,
//   spaceId
// }: {
//   envelopeId: string;
//   spaceId?: string;
//   credentials?: RequiredDocusignCredentials;
// }): Promise<void> {
//   credentials = credentials ?? (await getSpaceDocusignCredentials({ spaceId: spaceId as string }));

//   const envelope = await getEnvelope({
//     envelopeId,
//     credentials
//   });

//   const signers = envelope.recipients.signers;

//   const signersToCreate: DocusignRecipient[] = [];

//   const signerIdsToDelete: string[] = [];

//   for (const signer of signers) {
//     if (
//       signer.status !== 'completed' &&
//       (!signer.clientUserId || signer.embeddedRecipientStartURL !== signAtDocusign)
//     ) {
//       signerIdsToDelete.push(signer.recipientId);

//       signer.clientUserId = uuid();
//       signer.embeddedRecipientStartURL = signAtDocusign;
//       signer.recipientId = randomIntFromInterval(1000, 9999).toString();

//       signersToCreate.push(signer);
//     }
//   }

//   if (signersToCreate.length) {
//     log.info('Creating signers');
//     await createRecipients({
//       envelopeId,
//       recipients: signersToCreate,
//       credentials
//     });
//   }

//   for (const signerId of signerIdsToDelete) {
//     await deleteRecipient({
//       envelopeId,
//       recipientId: signerId,
//       credentials
//     });
//   }

//   const cacheKey = getDocusignEnvelopeCacheKey(envelopeId);

//   const newSignerSet = [
//     ...signersToCreate,
//     ...envelope.recipients.signers.filter(
//       (s) => !signersToCreate.some((createdSigner) => createdSigner.recipientId === s.recipientId)
//     )
//   ];

//   // This refresh is necessary since docusign only allows us to fetch an envelope every 15 minutes
//   await redisClient?.set(
//     cacheKey,
//     JSON.stringify({
//       ...envelope,
//       recipients: { ...envelope.recipients, signers: newSignerSet }
//     } as DocusignEnvelope),
//     {
//       EX: docusignPeriodBetweenRequestsInSeconds
//     }
//   );
// }

// export async function updateRecipients({
//   envelopeId,
//   spaceId,
//   recipients,
//   credentials
// }: {
//   envelopeId: string;
//   spaceId?: string;
//   recipients: DocusignRecipient[];
//   credentials?: RequiredDocusignCredentials;
// }) {
//   if (!spaceId && !credentials) {
//     throw new InvalidInputError('spaceId or credentials are required');
//   }

//   credentials = credentials ?? (await getSpaceDocusignCredentials({ spaceId: spaceId as string }));

//   const apiUrl = `${credentials.docusignApiBaseUrl}/restapi/v2.1/accounts/${credentials.docusignAccountId}/envelopes/${envelopeId}/recipients`;

//   const response = await PUT(
//     apiUrl,
//     { signers: recipients },
//     {
//       headers: docusignUserOAuthTokenHeader({ accessToken: credentials.accessToken })
//     }
//   );

//   return response;
// }

// export type DocusignEnvelopeLinkRequest = DocusignEnvelopeId & { spaceId: string; signerEmail: string; docusignEnvelopeId: string; };

// /**
//  * @external https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopeviews/createrecipient/
//  */
// export async function requestEnvelopeSigningLink({
//   docusignEnvelopeId,
//   spaceId,
//   signerEmail
// }: DocusignEnvelopeLinkRequest) {
//   const spaceCreds = await getSpaceDocusignCredentials({ spaceId });

//   const docusignEnvelope = await getEnvelope({
//     envelopeId: docusignEnvelopeId,
//     credentials: spaceCreds
//   });

//   const recipient = docusignEnvelope.recipients.signers.find((r) => lowerCaseEqual(r.email, signerEmail));

//   if (!recipient) {
//     throw new InvalidStateError('No signer found for envelope');
//   }

//   if (!recipient.clientUserId) {
//     throw new InvalidStateError('clientUserId is required for recipient');
//   }

//   const { domain: spaceDomain } = await prisma.space.findUniqueOrThrow({
//     where: { id: spaceId },
//     select: { domain: true }
//   });

//   const signerData = {
//     returnUrl: `${baseUrl}/${spaceDomain}`,
//     authenticationMethod: 'none',
//     // userId: recipient.userId,
//     recipientId: recipient.recipientIdGuid,
//     userName: recipient.name,
//     email: recipient.email,
//     clientUserId: recipient.clientUserId
//   };

//   const apiUrl = `${spaceCreds.docusignApiBaseUrl}/restapi/v2.1/accounts/${spaceCreds.docusignAccountId}/envelopes/${docusignEnvelopeId}/views/recipient`;

//   const url = (await POST<{ url: string }>(apiUrl, signerData, {
//     headers: docusignUserOAuthTokenHeader({ accessToken: spaceCreds.accessToken })
//   })) as { url: string };

//   return url.url;
// }

// export type DocusignTemplate = {
//   templateId: string;
//   uri: string;
//   name: string;
//   shared: boolean;
//   passwordProtected: boolean;
//   description: string;
//   created: string;
//   lastModified: string;
//   lastUsed: string;
//   owner: {
//     userName: string;
//     userId: string;
//     email: string;
//   };
//   pageCount: number;
//   folderId: string;
//   folderName: string;
//   folderIds: string[];
//   autoMatch: boolean;
//   autoMatchSpecifiedByUser: boolean;
//   emailSubject: string;
//   emailBlurb: string;
//   signingLocation: string;
//   authoritativeCopy: boolean;
//   enforceSignerVisibility: boolean;
//   enableWetSign: boolean;
//   allowMarkup: boolean;
//   allowReassign: boolean;
//   disableResponsiveDocument: boolean;
//   anySigner: any; // 'any' type can be replaced with more specific type if known
//   envelopeLocation: any; // 'any' type can be replaced with more specific type if known
// };

// export function getDocusignTemplates({ apiBaseUrl, authToken, accountId }: DocusignApiRequest & { accountId: string }) {
//   return GET<DocusignTemplate[]>(`${apiBaseUrl}/restapi/v2.1/accounts/${accountId}/templates`, undefined, {
//     headers: docusignUserOAuthTokenHeader({ accessToken: authToken })
//   });
// }
