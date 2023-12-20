import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { createRewardsForProposal } from 'lib/proposal/createRewardsForProposal';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createProposalRewardsController);

async function createProposalRewardsController(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  await createRewardsForProposal({
    proposalId,
    userId
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
