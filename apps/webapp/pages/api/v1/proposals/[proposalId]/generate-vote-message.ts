import { prisma } from '@charmverse/core/prisma-client';
import { isTestEnv } from '@packages/config/constants';
import { DataNotFoundError, UndesirableOperationError } from '@packages/core/errors';
import { getCurrentEvaluation } from '@packages/core/proposals';
import { requireKeys } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { getSnapshotProposal } from '@packages/lib/snapshot/getProposal';
import type { VoteChoice } from '@packages/lib/snapshot/interfaces';
import type { NextApiRequest, NextApiResponse } from 'next';

import type { SnapshotProposalVoteMessage, SnapshotProposalVoteType } from 'lib/public-api';
import { generateSnapshotVoteMessage } from 'lib/public-api/generateSnapshotVoteMessage';
import { apiHandler } from 'lib/public-api/handler';

const handler = apiHandler();

handler
  .use(
    requireKeys(
      [
        { key: 'address', valueType: 'wallet' },
        {
          key: 'choice',
          valueType: 'truthy'
        }
      ],
      'body'
    )
  )
  .post(generateSnapshotVoteMessageHandler);

/**
 * @example https://github.com/jellydn/next-swagger-doc/blob/main/example/models/organization.ts
 *
 * @swagger
 * components:
 *  schemas:
 *    GenerateSnapshotVoteMessageResponseBody:
 *      properties:
 *        message:
 *          $ref: '#/components/schemas/SnapshotProposalVoteMessage'
 *        types:
 *          $ref: '#/components/schemas/SnapshotProposalVoteType'
 *        domain:
 *          type: object
 */
export interface GenerateSnapshotVoteMessageResponseBody {
  message: SnapshotProposalVoteMessage;
  types: SnapshotProposalVoteType;
  domain: Record<string, string>;
}

/**
 * @swagger
 * /proposals/{proposalId}/generate-vote-message:
 *   post:
 *     summary: Generate a vote message for a snapshot proposal
 *     description: Generate a vote message for a snapshot proposal, which can be used to sign a vote on snapshot
 *     tags:
 *       - 'Partner API'
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *                type: object
 *                properties:
 *                  choice:
 *                    type: string
 *                  address:
 *                    type: string
 *                    example: '0x1234567890123456789012345678901234567890'
 *     responses:
 *       200:
 *         description: Summary of casted vote
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/GenerateSnapshotVoteMessageResponseBody'
 */
async function generateSnapshotVoteMessageHandler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateSnapshotVoteMessageResponseBody>
) {
  const { choice, address } = req.body as { choice: VoteChoice; address: string };
  const proposalId = req.query.proposalId as string;
  const snapshotApiUrl = isTestEnv ? (req.query.snapshotApiUrl as string) : undefined;

  const proposal = await prisma.proposal.findUnique({
    where: {
      id: proposalId
    },
    select: {
      status: true,
      space: {
        select: {
          snapshotDomain: true
        }
      },
      evaluations: true
    }
  });

  if (!proposal) {
    throw new DataNotFoundError(`Proposal with id ${proposalId} was not found.`);
  }

  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
  const isActiveVote = currentEvaluation?.result === null && currentEvaluation?.type === 'vote';
  if (!isActiveVote) {
    throw new UndesirableOperationError(`Proposal with id ${proposalId} is not in vote_active status.`);
  }

  const snapshotProposalId = currentEvaluation.snapshotId;
  if (!snapshotProposalId) {
    throw new DataNotFoundError(`Proposal with id ${proposalId} was not published to snapshot.`);
  }

  const spaceSnapshotDomain = proposal.space?.snapshotDomain;

  if (!spaceSnapshotDomain) {
    throw new UndesirableOperationError('No Snapshot domain connected to space yet.');
  }

  const snapshotProposal = await getSnapshotProposal(snapshotProposalId, snapshotApiUrl);

  if (!snapshotProposal) {
    throw new DataNotFoundError(`Proposal was not found on Snapshot.`);
  }

  const voteMessage = generateSnapshotVoteMessage({
    message: {
      space: spaceSnapshotDomain,
      proposal: snapshotProposalId,
      type: snapshotProposal.type,
      choice,
      reason: '',
      app: 'my-app'
    },
    address
  });

  return res.status(200).json(voteMessage);
}

export default withSessionRoute(handler);
