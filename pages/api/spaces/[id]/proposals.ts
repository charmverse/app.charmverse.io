import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { getProposalsBySpace } from 'lib/proposal/getProposalsBySpace';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getProposals);

async function getProposals (req: NextApiRequest, res: NextApiResponse<ProposalWithUsers[]>) {
  const spaceId = req.query.id as string;
  const { id: userId } = req.session.user;

  const proposals = await getProposalsBySpace({ spaceId, userId });

  return res.status(200).json(proposals);
}

export default withSessionRoute(handler);
