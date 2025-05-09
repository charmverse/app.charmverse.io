import type { ApplicationStatus } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getMarkdownText } from 'lib/prosemirror/getMarkdownText';
import type { UserProfile } from 'lib/public-api';
import { apiHandler } from 'lib/public-api/handler';
import { getUserProfile, userProfileSelect } from 'lib/public-api/searchUserProfile';

const handler = apiHandler();

handler.get(getSubmissions);

/**
 * @swagger
 * components:
 *  schemas:
 *    EASCredential:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *        content:
 *          type: object
 *        attester:
 *          type: string
 *        recipient:
 *          type: string
 *        schemaId:
 *          type: string
 *        createdAt:
 *          type: string
 *        chainId:
 *          type: number
 *        source:
 *          type: string
 *          enum: [onchain, charmverse]
 *        verificationUrl:
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
 *            $ref: '#/components/schemas/EASCredential'
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
 *          type: string
 *          enum:
 *            - application_applied
 *            - submission_rejected
 *            - cancelled
 *            - submission_in_progress
 *            - application_rejected
 *            - submission_in_review
 *            - complete
 *            - processing
 *            - paid
 */

type PublicApiEASCredential = {
  id: string;
  content: object;
  attester: string;
  recipient: string;
  schemaId: string;
  createdAt: string;
  chainId: number;
  source: 'onchain' | 'charmverse';
  verificationUrl: string | null;
};

export const REWARD_APPLICATION_STATUS_RENAME: Record<ApplicationStatus, string> = {
  applied: 'application_applied',
  submission_rejected: 'submission_rejected',
  cancelled: 'cancelled',
  rejected: 'application_rejected',
  inProgress: 'submission_in_progress',
  review: 'submission_in_review',
  complete: 'complete',
  processing: 'processing',
  paid: 'paid'
};

type PublicApiSubmissionStatus = keyof typeof REWARD_APPLICATION_STATUS_RENAME;

export type PublicApiSubmission = {
  id: string;
  createdAt: Date;
  rewardId: string;
  credentials: PublicApiEASCredential[];
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
  status: PublicApiSubmissionStatus;
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
  const rewardId = req.query.rewardId as string;
  const spaceId = req.authorizedSpaceId;

  const submissions = await prisma.application.findMany({
    where: {
      ...(spaceId ? { spaceId } : { bountyId: rewardId, spaceId }),
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
          status: REWARD_APPLICATION_STATUS_RENAME[submission.status] as PublicApiSubmissionStatus,
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
          credentials: []
        };
      })
    )
  );
}

export default handler;
