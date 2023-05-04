import type { AvailableProposalCategoryPermissionFlags } from '@charmverse/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import type { PermissionCompute } from 'lib/permissions/interfaces';
import { computeProposalCategoryPermissions } from 'lib/permissions/proposals/computeProposalCategoryPermissions';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys<PermissionCompute>(['resourceId'], 'body')).post(computePermissions);

async function computePermissions(req: NextApiRequest, res: NextApiResponse<AvailableProposalCategoryPermissionFlags>) {
  const input = req.body as PermissionCompute;

  const permissions = await computeProposalCategoryPermissions({
    resourceId: input.resourceId,
    userId: req.session.user?.id
  });
  res.status(200).json(permissions);
}

export default withSessionRoute(handler);
