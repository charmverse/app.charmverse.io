import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { getAccessibleProposalCategories } from 'lib/permissions/proposals/getAccessibleProposalCategories';
import type { ListProposalsRequest } from 'lib/proposal/getProposalsBySpace';
import { getProposalsBySpace } from 'lib/proposal/getProposalsBySpace';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' })).post(getProposals);

async function getProposals(req: NextApiRequest, res: NextApiResponse<ProposalWithUsers[]>) {
  const query = req.body as ListProposalsRequest;
  const { id: userId } = req.session.user;

  const accessibleCategories = await getAccessibleProposalCategories({
    userId,
    spaceId: query.spaceId
  });

  const viewableProposals = await getProposalsBySpace({
    spaceId: query.spaceId,
    userId,
    categoryIds: accessibleCategories.map((c) => c.id)
  });

  const userProposals = await getProposalsBySpace({
    spaceId: query.spaceId,
    userId,
    categoryIds: accessibleCategories.map((c) => c.id)
  });

  // Dedupe proposals
  const mapped = [...viewableProposals, ...userProposals].reduce((acc, proposal) => {
    acc[proposal.id] = proposal;
    return acc;
  }, {} as Record<string, ProposalWithUsers>);

  const proposals = Object.values(mapped) as ProposalWithUsers[];

  return res.status(200).json(proposals);
}

export default withSessionRoute(handler);
