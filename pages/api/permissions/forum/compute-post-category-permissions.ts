import type { PostCategoryPermissionFlags } from '@charmverse/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { getPermissionsClient } from 'lib/permissions/api';
import type { PermissionCompute } from 'lib/permissions/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys<PermissionCompute>(['resourceId'], 'body')).post(computePermissions);

async function computePermissions(req: NextApiRequest, res: NextApiResponse<PostCategoryPermissionFlags>) {
  const input = req.body as PermissionCompute;
  const permissions = await getPermissionsClient({
    resourceId: input.resourceId,
    resourceIdType: 'postCategory'
  }).then((client) =>
    client.forum.computePostCategoryPermissions({
      resourceId: input.resourceId,
      userId: req.session.user?.id
    })
  );
  res.status(200).json(permissions);
}

export default withSessionRoute(handler);
