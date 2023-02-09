import type { UserVote } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSuperApiKey, requireKeys } from 'lib/middleware';
import { castProposalVote } from 'lib/public-api/castProposalVote';
import type { CastProposalVoteRequestBody } from 'lib/public-api/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  // TODO: require either super api key or "regular" api key
  .use(requireSuperApiKey)
  .use(
    requireKeys(
      [
        { key: 'proposalId', truthy: true },
        { key: 'spaceId', truthy: true },
        { key: 'userId', truthy: true },
        { key: 'choice', truthy: true }
      ],
      'body'
    )
  )
  .post(castVote);

/**
 * @swagger
 * /api/v1/proposals/vote:
 *   post:
 *     summary: Cast a vote on a proposal.
 *     description: Cast a vote on a proposal with active voting.
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
