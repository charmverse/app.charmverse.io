import { DataNotFoundError, UndesirableOperationError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAddress } from 'viem';

import * as http from 'adapters/http';
import { requireKeys } from 'lib/middleware';
import { apiHandler } from 'lib/public-api/handler';
import { withSessionRoute } from 'lib/session/withSession';
import { getSnapshotProposal } from 'lib/snapshot/getProposal';
import { coerceToMilliseconds } from 'lib/utilities/dates';

import type { GenerateSnapshotVoteMessageResponseBody } from './generate-vote-message';

const handler = apiHandler();

handler
  .use(
    requireKeys(
      [
        { key: 'address', truthy: true },
        {
          key: 'sig',
          truthy: true
        },
        {
          key: 'data',
          truthy: true
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
 *                type: object
 *                properties:
 *                  address:
 *                    type: string
 *                  data:
 *                    $ref: '#/components/schemas/GenerateSnapshotVoteMessageResponseBody'
 *                  sig:
 *                    type: string
 */
async function snapshotVoteHandler(req: NextApiRequest, res: NextApiResponse) {
  const payload = req.body as { address: string; data: GenerateSnapshotVoteMessageResponseBody; sig: string };
  const proposalId = req.query.proposalId as string;
  const proposal = await prisma.proposal.findUnique({
    where: {
      id: proposalId
    },
    select: {
      status: true,
      page: {
        select: {
          snapshotProposalId: true
        }
      }
    }
  });

  const snapshotProposalId = proposal?.page?.snapshotProposalId;
  if (!snapshotProposalId) {
    throw new DataNotFoundError(`A vote for proposal id ${proposalId} was not found.`);
  }

  const snapshotProposal = await getSnapshotProposal(snapshotProposalId);

  if (!snapshotProposal) {
    throw new DataNotFoundError(`Proposal was not found on Snapshot.`);
  }

  if (snapshotProposal.state !== 'active') {
    throw new UndesirableOperationError(`Voting for proposal with id: ${proposalId} is not active.`);
  }

  const proposalEndDate = coerceToMilliseconds(snapshotProposal?.end ?? 0);
  const hasPassedDeadline = proposalEndDate < Date.now();

  if (hasPassedDeadline) {
    throw new UndesirableOperationError(`Voting for proposal with id: ${proposalId} has passed the deadline.`);
  }

  await http.POST('https://seq.snapshot.org/', {
    ...payload,
    address: getAddress(payload.address)
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
