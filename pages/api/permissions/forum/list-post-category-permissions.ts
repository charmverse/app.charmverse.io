import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import type { AssignedPostCategoryPermission } from 'lib/permissions/forum/interfaces';
import { listPostCategoryPermissions } from 'lib/permissions/forum/listPostCategoryPermissions';
import type { PermissionCompute } from 'lib/permissions/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys<PermissionCompute>(['resourceId'], 'query')).get(listPermissions);

async function listPermissions(req: NextApiRequest, res: NextApiResponse<AssignedPostCategoryPermission[]>) {
  const input = req.query as PermissionCompute;

  const permissions = await listPostCategoryPermissions({
    resourceId: input.resourceId,
    userId: req.session.user?.id
  });
  res.status(200).json(permissions);
}

export default withSessionRoute(handler);
