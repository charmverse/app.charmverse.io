// /**
//  * Below methods are the API reference links for the Docusign API
//  */

// import { log } from '@charmverse/core/log';
// import { prisma } from '@charmverse/core/prisma-client';

// import { GET, POST } from 'adapters/http';
// import { redisClient } from 'adapters/redis/redisClient';
// import { baseUrl } from 'config/constants';
// import { InvalidStateError } from 'lib/middleware';
// import { prettyPrint } from 'lib/utils/strings';

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
