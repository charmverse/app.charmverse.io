import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { deleteProposalCategory } from 'lib/proposal/deleteProposalCategory';
import type { ProposalCategory } from 'lib/proposal/interface';
import { updateProposalCategory } from 'lib/proposal/updateProposalCategory';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .put(updateCategory)
  .delete(deleteCategory);

async function updateCategory (req: NextApiRequest, res: NextApiResponse<ProposalCategory>) {
  const spaceId = req.query.id as string;
  const categoryId = req.query.categoryId as string;
  const categoryData = req.body as Partial<ProposalCategory>;

  const category = await updateProposalCategory(categoryId, { ...categoryData, spaceId });

  return res.status(200).json(category);
}

async function deleteCategory (req: NextApiRequest, res: NextApiResponse) {
  await deleteProposalCategory(req.query.categoryId as string);

  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
