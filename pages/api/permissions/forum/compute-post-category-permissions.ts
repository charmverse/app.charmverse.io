import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { computePostCategoryPermissions } from 'lib/permissions/forum/computePostCategoryPermissions';
import type { AvailablePostCategoryPermissionFlags } from 'lib/permissions/forum/interfaces';
import type { PermissionCompute } from 'lib/permissions/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys<PermissionCompute>(['resourceId'], 'body')).post(computePermissions);

async function computePermissions(req: NextApiRequest, res: NextApiResponse<AvailablePostCategoryPermissionFlags>) {
  const input = req.body as PermissionCompute;

  const permissions = await computePostCategoryPermissions({
    resourceId: input.resourceId,
    userId: req.session.user?.id
  });
  res.status(200).json(permissions);
}

export default withSessionRoute(handler);
