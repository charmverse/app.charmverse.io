import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import type { PermissionCompute } from 'lib/permissions/interfaces';
import type { AssignedProposalCategoryPermission } from 'lib/permissions/proposals/interfaces';
import { listProposalCategoryPermissions } from 'lib/permissions/proposals/listProposalCategoryPermissions';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys<PermissionCompute>(['resourceId'], 'query')).get(listPermissions);

async function listPermissions(req: NextApiRequest, res: NextApiResponse<AssignedProposalCategoryPermission[]>) {
  const input = req.query as PermissionCompute;

  const permissions = await listProposalCategoryPermissions({
    resourceId: input.resourceId,
    userId: req.session.user?.id
  });
  res.status(200).json(permissions);
}

export default withSessionRoute(handler);
