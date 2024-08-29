import { getProposalsReviewers } from '@root/lib/proposals/getProposalsReviewers';
import type { GetProposalsReviewersResponse } from '@root/lib/proposals/getProposalsReviewers';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getProposalsReviewersController).use(
  requireSpaceMembership({
    adminOnly: true,
    spaceIdKey: 'id'
  })
);

async function getProposalsReviewersController(
  req: NextApiRequest,
  res: NextApiResponse<GetProposalsReviewersResponse>
) {
  const spaceId = req.query.id as string;
  const proposalsReviewers = await getProposalsReviewers({ spaceId });

  return res.status(200).json(proposalsReviewers);
}

export default withSessionRoute(handler);
