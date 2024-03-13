import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';

import type { UserProfile } from 'lib/public-api';
import { apiHandler } from 'lib/public-api/handler';
import { getUserProfile, userProfileSelect } from 'lib/public-api/searchUserProfile';
import { submissionStatuses } from 'lib/rewards/constants';

const handler = apiHandler();

handler.get(getSubmissions);

/**
 * @swagger
 * components:
 *  schemas:
 *    Application:
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
 *    Submission:
 *      type: object
 *      properties:
 *        submission:
 *          $ref: '#/components/schemas/Application'
 *          nullable: true
 *        application:
 *          $ref: '#/components/schemas/Application'
 *          nullable: true
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
 *              ceramicId:
 *                type: string
 *              createdAt:
 *                type: string
 *                format: date-time
 *                example: 2022-04-04T21:32:38.317Z
 *        author:
 *          $ref: '#/components/schemas/UserProfile'
 */

type Application = {
  id: string;
  createdAt: Date;
  rewardId: string;
};

export type PublicApiSubmission = {
  credentials: {
    id: string;
    ceramicId: string;
    createdAt: Date;
  }[];
  author: UserProfile;
} & (
  | {
      submission: Application;
      application: null;
    }
  | {
      submission: null;
      application: Application;
    }
);

/**
 * @swagger
 * /submissions:
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
 *         description: List of submissions
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
      issuedCredentials: {
        select: {
          createdAt: true,
          ceramicId: true,
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
    submissions.map((submission) => {
      const application = {
        id: submission.id,
        createdAt: submission.createdAt,
        rewardId: submission.bountyId
      };

      const isSubmission = submission.bounty.approveSubmitters ? submissionStatuses.includes(submission.status) : false;
      return {
        ...(isSubmission
          ? {
              submission: application,
              application: null
            }
          : {
              application,
              submission: null
            }),
        credentials: submission.issuedCredentials,
        author: getUserProfile(submission.applicant)
      };
    })
  );
}

export default handler;
