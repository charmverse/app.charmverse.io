import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { createProposalCategory } from 'lib/proposal/createProposalCategory';
import { getProposalCategoriesBySpace } from 'lib/proposal/getProposalCategoriesBySpace';
import type { ProposalCategory } from 'lib/proposal/interface';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getCategories)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(createCategory);

async function getCategories (req: NextApiRequest, res: NextApiResponse<ProposalCategory[]>) {
  const spaceId = req.query.id as string;

  const categories = await getProposalCategoriesBySpace(spaceId);

  return res.status(200).json(categories);
}

async function createCategory (req: NextApiRequest, res: NextApiResponse<ProposalCategory>) {
  const spaceId = req.query.id as string;
  const categoryData = req.body as Omit<ProposalCategory, 'id' | 'spaceId'>;

  const category = await createProposalCategory({ ...categoryData, spaceId });

  return res.status(200).json(category);
}

export default withSessionRoute(handler);
