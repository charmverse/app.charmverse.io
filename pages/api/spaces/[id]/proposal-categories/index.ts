import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { computeProposalCategoryPermissions } from 'lib/permissions/proposals/computeProposalCategoryPermissions';
import { getAccessibleProposalCategories } from 'lib/permissions/proposals/getAccessibleProposalCategories';
import type { ProposalCategoryWithPermissions } from 'lib/permissions/proposals/interfaces';
import { createProposalCategory } from 'lib/proposal/createProposalCategory';
import type { ProposalCategory } from 'lib/proposal/interface';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getCategories)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(createCategory);

async function getCategories(req: NextApiRequest, res: NextApiResponse<ProposalCategoryWithPermissions[]>) {
  const spaceId = req.query.id as string;

  const categories = await getAccessibleProposalCategories({
    spaceId,
    userId: req.session.user?.id
  });

  return res.status(200).json(categories);
}

async function createCategory(req: NextApiRequest, res: NextApiResponse<ProposalCategoryWithPermissions>) {
  const spaceId = req.query.id as string;
  const categoryData = req.body as Omit<ProposalCategory, 'id' | 'spaceId'>;

  const category = await createProposalCategory({ ...categoryData, spaceId });

  const permissions = await computeProposalCategoryPermissions({
    resourceId: category.id,
    userId: req.session.user?.id
  });

  return res.status(200).json({ ...category, permissions });
}

export default withSessionRoute(handler);
