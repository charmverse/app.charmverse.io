import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from 'lib/middleware';
import type { CreateProposalFromTemplateInput } from 'lib/proposal/createProposalFromTemplate';
import type { ProposalReviewerPool } from 'lib/proposal/getProposalReviewerPool';
import { getProposalReviewerPool } from 'lib/proposal/getProposalReviewerPool';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys<CreateProposalFromTemplateInput>(['spaceId'], 'query'))
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'spaceId' }))
  .get(getReviewerPoolController);

async function getReviewerPoolController(req: NextApiRequest, res: NextApiResponse<ProposalReviewerPool>) {
  const { spaceId } = req.query;

  const reviewerPool = await getProposalReviewerPool({ spaceId: spaceId as string });

  return res.status(200).json(reviewerPool);
}

export default withSessionRoute(handler);
