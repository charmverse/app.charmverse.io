import { InvalidInputError } from '@charmverse/core/errors';
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
 *    ApplicationStatus:
 *      type: string
 *      enum: [applied, submission_rejected, in_progress, in_review, rejected, processing, complete, paid, cancelled]
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
 *            type: object
 *            properties:
 *              id:
 *                type: string
 *                format: uuid
 *                example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *              createdAt:
 *                type: string
 *                format: date-time
 *                example: 2022-04-04T21:32:38.317Z
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
  credentials: {
    id: string;
    createdAt: Date;
  }[];
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
    where: spaceId ? { spaceId } : { bountyId: rewardId, spaceId: authorizedSpaceId },
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
        select: {
          createdAt: true,
          id: true
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
        };
      })
    )
  );
}

export default handler;
