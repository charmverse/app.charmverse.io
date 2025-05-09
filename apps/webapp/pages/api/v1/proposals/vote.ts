import type { UserVote } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

import { requireKeys } from '@packages/lib/middleware';
import { castProposalVote } from 'lib/public-api/castProposalVote';
import { apiHandler } from 'lib/public-api/handler';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = apiHandler();

handler
  .use(
    requireKeys(
      [
        { key: 'proposalId', valueType: 'uuid' },
        { key: 'userId', valueType: 'uuid' },
        { key: 'choice', valueType: 'truthy' }
      ],
      'body'
    )
  )
  .post(castVote);

/**
 * @example https://github.com/jellydn/next-swagger-doc/blob/main/example/models/organization.ts
 *
 * @swagger
 * components:
 *  schemas:
 *    CastProposalVoteRequestBody:
 *      required:
 *        - spaceId
 *        - proposalId
 *        - userId
 *        - choice
 *      type: object
 *      properties:
 *        proposalId:
 *          type: string
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        userId:
 *          type: string
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        choice:
 *          type: string
 *          example: Abstain
 */
export interface CastProposalVoteRequestBody {
  proposalId: string;
  userId: string;
  choice: string;
}

/**
 * @example https://github.com/jellydn/next-swagger-doc/blob/main/example/models/organization.ts
 *
 * @swagger
 * components:
 *  schemas:
 *    CastProposalVoteResponseBody:
 *      type: object
 *      properties:
 *        voteId:
 *          type: string
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        userId:
 *          type: string
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        choices:
 *          type: array
 *          items:
 *            type: string
 *          example: ['Abstain']
 *        createdAt:
 *          type: string
 *          format: date-time
 *          example: 2022-04-04T21:32:38.317Z
 *        updatedAt:
 *          type: string
 *          format: date-time
 *          example: 2022-04-04T21:32:38.317Z
 */
export interface CastProposalVoteResponseBody {
  voteId: string;
  userId: string;
  choices: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * @swagger
 * /proposals/vote:
 *   post:
 *     summary: Cast a vote on a proposal.
 *     description: Cast a vote on a proposal with active voting. You can retrieve available options from the proposal object.
 *     tags:
 *       - 'Partner API'
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *                $ref: '#/components/schemas/CastProposalVoteRequestBody'
 *     responses:
 *       200:
 *         description: Summary of casted vote
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/CastProposalVoteResponseBody'
 */
async function castVote(req: NextApiRequest, res: NextApiResponse<UserVote>) {
  const result = await castProposalVote(req.body as CastProposalVoteRequestBody);

  return res.status(200).json(result);
}

export default withSessionRoute(handler);
