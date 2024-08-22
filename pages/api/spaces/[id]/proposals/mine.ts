import type { ActionableProposal } from '@root/lib/proposals/getActionableProposals';
import { getActionableProposals } from '@root/lib/proposals/getActionableProposals';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getMyProposalsController);

async function getMyProposalsController(req: NextApiRequest, res: NextApiResponse<ActionableProposal[]>) {
  const userId = req.session.user?.id;
  const spaceId = req.query.id as string;
  const actionableProposals = await getActionableProposals({ spaceId, userId });

  return res.status(200).json(actionableProposals);
}

export default withSessionRoute(handler);
