import { DataNotFoundError, UndesirableOperationError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import * as http from '@packages/adapters/http';
import { isTestEnv } from '@packages/config/constants';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAddress } from 'viem';

import { requireKeys } from '@packages/lib/middleware';
import { apiHandler } from 'lib/public-api/handler';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { getSnapshotProposal } from '@packages/lib/snapshot/getProposal';
import { coerceToMilliseconds, getCurrentDate } from '@packages/lib/utils/dates';

import type { GenerateSnapshotVoteMessageResponseBody } from './generate-vote-message';

const handler = apiHandler();

handler
  .use(
    requireKeys(
      [
        { key: 'address', valueType: 'wallet' },
        {
          key: 'sig',
          valueType: 'truthy'
        },
        {
          key: 'data',
          valueType: 'truthy'
        }
      ],
      'body'
    )
  )
  .post(snapshotVoteHandler);

/**
 * @swagger
 * /proposals/{proposalId}/snapshot-vote:
 *   post:
 *     summary: Vote for a snapshot proposal
 *     description: Vote for a snapshot proposal
 *     tags:
 *       - 'Partner API'
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *                required:
 *                  - address
 *                  - data
 *                  - sig
 *                type: object
 *                properties:
 *                  address:
 *                    type: string
 *                    example: '0x1234567890123456789012345678901234567890'
 *                  data:
 *                    $ref: '#/components/schemas/GenerateSnapshotVoteMessageResponseBody'
 *                  sig:
 *                    type: string
 */
async function snapshotVoteHandler(req: NextApiRequest, res: NextApiResponse) {
  const payload = req.body as { address: string; data: GenerateSnapshotVoteMessageResponseBody; sig: string };
  const proposalId = req.query.proposalId as string;
  const snapshotApiUrl = isTestEnv ? (req.query.snapshotApiUrl as string) : undefined;
  const seqSnapshotUrl = isTestEnv ? (req.query.seqSnapshotUrl as string) : 'https://seq.snapshot.org/';
  const proposal = await prisma.proposal.findUnique({
    where: {
      id: proposalId
    },
    select: {
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

  const snapshotProposal = await getSnapshotProposal(snapshotProposalId, snapshotApiUrl);

  if (!snapshotProposal) {
    throw new DataNotFoundError(`Proposal was not found on Snapshot.`);
  }

  if (snapshotProposal.state !== 'active') {
    throw new UndesirableOperationError(`Voting for proposal with id: ${proposalId} is not active.`);
  }

  const proposalEndDate = coerceToMilliseconds(snapshotProposal?.end ?? 0);
  const hasPassedDeadline = proposalEndDate < getCurrentDate().getTime();

  if (hasPassedDeadline) {
    throw new UndesirableOperationError(`Voting for proposal with id: ${proposalId} has passed the deadline.`);
  }

  await http.POST(seqSnapshotUrl, {
    ...payload,
    address: getAddress(payload.address)
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
