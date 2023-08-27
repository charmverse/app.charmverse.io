import type { ProposalWithUsers } from '@charmverse/core/proposals';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership()).get(getProposalBlocksHandler);

async function getProposalBlocksHandler(req: NextApiRequest, res: NextApiResponse<ProposalWithUsers[]>) {
  const categoryIds = req.query.categoryIds;
  const userId = req.session.user?.id;
  const spaceId = req.query.id as string;

  const proposals = await req.basePermissionsClient.proposals.getAccessibleProposals({
    categoryIds,
    spaceId,
    userId
  });

  return res.status(200).json(proposals);
}

export default withSessionRoute(handler);
