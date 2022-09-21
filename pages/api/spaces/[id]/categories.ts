import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { getProposalCategoriesBySpace } from 'lib/proposal/getProposalCategoriesBySpace';
import type { ProposalCategory } from 'lib/proposal/interface';
import { withSessionRoute } from 'lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getCategories);

async function getCategories (req: NextApiRequest, res: NextApiResponse<ProposalCategory[]>) {
  const spaceId = req.query.id as string;

  const categories = await getProposalCategoriesBySpace(spaceId);

  return res.status(200).json(categories);
}

export default withSessionRoute(handler);
