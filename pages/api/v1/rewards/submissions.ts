import { InvalidInputError } from '@charmverse/core/errors';
import type { ApplicationStatus } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { type EASAttestationFromApi } from 'lib/credentials/external/getOnchainCredentials';
import { getMarkdownText } from 'lib/prosemirror/getMarkdownText';
import type { UserProfile } from 'lib/public-api';
import { apiHandler } from 'lib/public-api/handler';
import { getUserProfile, userProfileSelect } from 'lib/public-api/searchUserProfile';
import { isTruthy } from 'lib/utils/types';

const handler = apiHandler();

handler.get(getSubmissions);

/**
 * @swagger
 * components:
 *  schemas:
 *    EASAttestationFromApi:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          format: uuid
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        content:
 *          type: object
 *        attester:
 *          type: string
 *        recipient:
 *          type: string
 *        schemaId:
 *          type: string
 *        timeCreated:
 *          type: number
 *        chainId:
 *          type: string
 *        type:
 *          type: string
 *          enum: [onchain, charmverse, gitcoin]
 *        verificationUrl:
 *          type: string
 *          nullable: true
 *        iconUrl:
 *          type: string
 *          nullable: true
 *        issuedCredentialId:
 *          type: string
 *          nullable: true
 *    PublicApiSubmission:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          format: uuid
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        createdAt:
 *          type: string
 *          format: date-time
 *          example: 2022-04-04T21:32:38.317Z
 *        rewardId:
 *          type: string
 *          format: uuid
 *        credentials:
 *          type: array
 *          items:
 *            $ref: '#/components/schemas/EASAttestationFromApi'
 *        submission:
 *          type: object
 *          properties:
 *            content:
 *              type: object
 *              properties:
 *                text:
 *                  type: string
 *                markdown:
 *                  type: string
 *          nullable: true
 *        application:
 *          type: object
 *          properties:
 *            content:
 *              type: object
 *              properties:
 *                text:
 *                  type: string
 *          nullable: true
 *        author:
 *          $ref: '#/components/schemas/UserProfile'
 *        status:
 *          $ref: '#/components/schemas/ApplicationStatus'
 */

export type PublicApiSubmission = {
  id: string;
  createdAt: Date;
  rewardId: string;
  credentials: EASAttestationFromApi[];
  submission?: {
    content: {
      text: string;
      markdown: string;
    };
  };
  application?: {
    content: {
      text: string;
    };
  };
  status: Omit<ApplicationStatus, 'inProgress' | 'review'> | 'in_progress' | 'in_review';
  author: UserProfile;
};

/**
 * @swagger
 * /rewards/submissions:
 *   get:
 *     summary: Retrieve a list of submissions
 *     description: Retrieve submissions from your space.
 *     tags:
 *      - 'Space API'
 *     parameters:
 *      - in: query
 *        name: spaceId
 *        schema:
 *          type: string
 *        required: false
 *      - in: query
 *        name: rewardId
 *        schema:
 *          type: string
 *        required: false
 *     responses:
 *       200:
 *         description: List of submissions (with applications) for the space or reward
 *         content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/PublicApiSubmission'
 */
async function getSubmissions(req: NextApiRequest, res: NextApiResponse<PublicApiSubmission[]>) {
  const spaceId = req.query.spaceId as string;
  const rewardId = req.query.rewardId as string;
  const authorizedSpaceId = req.authorizedSpaceId;

  if (!spaceId && !rewardId) {
    throw new InvalidInputError('Missing spaceId or rewardId');
  }

  const submissions = await prisma.application.findMany({
    where: {
      ...(spaceId ? { spaceId } : { bountyId: rewardId, spaceId: authorizedSpaceId }),
      bounty: {
        page: {
          deletedAt: null
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      createdAt: true,
      bountyId: true,
      submission: true,
      submissionNodes: true,
      message: true,
      issuedCredentials: {
        where: {
          ceramicRecord: {
            not: undefined
          }
        },
        select: {
          ceramicRecord: true
        }
      },
      bounty: {
        select: {
          approveSubmitters: true
        }
      },
      status: true,
      applicant: {
        select: userProfileSelect
      }
    }
  });

  return res.status(200).json(
    await Promise.all(
      submissions.map(async (submission) => {
        return {
          id: submission.id,
          createdAt: submission.createdAt,
          rewardId: submission.bountyId,
          author: getUserProfile(submission.applicant),
          status:
            submission.status === 'inProgress'
              ? 'in_progress'
              : submission.status === 'review'
              ? 'in_review'
              : submission.status,
          submission:
            submission.submissionNodes && submission.submission
              ? {
                  content: {
                    text: submission.submission,
                    markdown: await getMarkdownText(JSON.parse(submission.submissionNodes))
                  }
                }
              : undefined,
          application: submission.message
            ? {
                content: {
                  text: submission.message
                }
              }
            : undefined,
          credentials: submission.issuedCredentials
            .map((credential) => {
              return credential.ceramicRecord;
            })
            .filter(isTruthy)
            .map((ceramicRecord: any) => {
              const { sig, issuer, timestamp, charmverseId, __typename, ...credential } = ceramicRecord;
              return credential as EASAttestationFromApi;
            })
        };
      })
    )
  );
}

export default handler;
