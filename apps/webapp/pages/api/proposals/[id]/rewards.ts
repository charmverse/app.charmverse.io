import { log } from '@packages/core/log';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { createRewardsForProposal } from '@packages/lib/proposals/createRewardsForProposal';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { InvalidStateError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createProposalRewardsController);

async function createProposalRewardsController(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  if (!permissions.evaluate) {
    throw new InvalidStateError('Only reviewers can create rewards for a proposal');
  }

  await createRewardsForProposal({
    proposalId,
    userId
  });
  log.info('Rewards created for proposal', { userId, pageId: proposalId, proposalId });

  return res.status(200).end();
}

export default withSessionRoute(handler);
