import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { ProposalFlowFlags } from 'lib/proposal/state/transition';
import { computeProposalFlowFlags } from 'lib/proposal/state/transition';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getFlowFlagsController);

async function getFlowFlagsController(req: NextApiRequest, res: NextApiResponse<ProposalFlowFlags>) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const flowFlags = await computeProposalFlowFlags({
    proposalId,
    userId
  });
  return res.status(200).send(flowFlags);
}

export default withSessionRoute(handler);
