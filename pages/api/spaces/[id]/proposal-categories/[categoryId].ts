import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { computeProposalCategoryPermissions } from 'lib/permissions/proposals/computeProposalCategoryPermissions';
import type { ProposalCategoryWithPermissions } from 'lib/permissions/proposals/interfaces';
import { deleteProposalCategory } from 'lib/proposal/deleteProposalCategory';
import type { ProposalCategory } from 'lib/proposal/interface';
import { updateProposalCategory } from 'lib/proposal/updateProposalCategory';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updateCategory).delete(deleteCategory);

async function updateCategory(req: NextApiRequest, res: NextApiResponse<ProposalCategoryWithPermissions>) {
  const spaceId = req.query.id as string;
  const categoryId = req.query.categoryId as string;
  const categoryData = req.body as Partial<ProposalCategory>;

  const permissions = await computeProposalCategoryPermissions({
    resourceId: categoryId,
    userId: req.session.user?.id
  });

  if (!permissions.edit) {
    throw new ActionNotPermittedError(`You don't have permission to edit this category`);
  }

  const category = await updateProposalCategory(categoryId, { ...categoryData, spaceId });

  return res.status(200).json({ ...category, permissions });
}

async function deleteCategory(req: NextApiRequest, res: NextApiResponse) {
  const permissions = await computeProposalCategoryPermissions({
    resourceId: req.query.categoryId as string,
    userId: req.session.user?.id
  });
  if (!permissions.delete) {
    throw new ActionNotPermittedError(`You don't have permission to edit this category`);
  }

  await deleteProposalCategory(req.query.categoryId as string);

  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
