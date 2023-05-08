import type { ProposalCategoryWithPermissions } from '@charmverse/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { createProposalCategory } from 'lib/proposal/createProposalCategory';
import type { ProposalCategory } from 'lib/proposal/interface';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(providePermissionClients({ key: 'id', location: 'query', resourceIdType: 'space' }))
  .get(getCategories)
  .post(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }), createCategory);

async function getCategories(req: NextApiRequest, res: NextApiResponse<ProposalCategoryWithPermissions[]>) {
  const spaceId = req.query.id as string;

  const userId = req.session.user?.id;

  const categories = await req.basePermissionsClient.proposals.getProposalCategories({
    spaceId,
    userId
  });

  return res.status(200).json(categories);
}

async function createCategory(req: NextApiRequest, res: NextApiResponse<ProposalCategoryWithPermissions>) {
  const spaceId = req.query.id as string;
  const categoryData = req.body as Omit<ProposalCategory, 'id' | 'spaceId'>;
  const category = await createProposalCategory({ data: { ...categoryData, spaceId } });

  if (req.spacePermissionsEngine === 'premium') {
    await req.premiumPermissionsClient.proposals.assignDefaultProposalCategoryPermissions({
      resourceId: category.id
    });
  }
  const permissions = await req.basePermissionsClient.proposals.computeProposalCategoryPermissions({
    resourceId: category.id,
    userId: req.session.user?.id
  });

  return res.status(200).json({ ...category, permissions });
}

export default withSessionRoute(handler);
