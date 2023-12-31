import {
  AvailableProposalCategoryPermissions,
  type ProposalCategoryWithPermissions
} from '@charmverse/core/permissions';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { createProposalCategory } from 'lib/proposal/createProposalCategory';
import type { ProposalCategory } from 'lib/proposal/interface';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getCategories).post(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }), createCategory);

async function getCategories(req: NextApiRequest, res: NextApiResponse<ProposalCategoryWithPermissions[]>) {
  const spaceId = req.query.id as string;

  const userId = req.session.user?.id;

  const categories = await permissionsApiClient.proposals.getAccessibleProposalCategories({
    spaceId,
    userId
  });

  return res.status(200).json(categories);
}

async function createCategory(req: NextApiRequest, res: NextApiResponse<ProposalCategoryWithPermissions>) {
  const spaceId = req.query.id as string;
  const categoryData = req.body as Omit<ProposalCategory, 'id' | 'spaceId'>;
  const category = await createProposalCategory({ data: { ...categoryData, spaceId } });

  return res.status(201).json({ ...category, permissions: new AvailableProposalCategoryPermissions().full });
}

export default withSessionRoute(handler);
