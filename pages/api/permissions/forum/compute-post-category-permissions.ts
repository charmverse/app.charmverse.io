import type { PostCategoryPermissionFlags } from '@charmverse/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import type { PermissionCompute } from 'lib/permissions/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(
    providePermissionClients({
      key: 'resourceId',
      location: 'body',
      resourceIdType: 'postCategory'
    })
  )
  .use(requireKeys<PermissionCompute>(['resourceId'], 'body'))
  .post(computePermissions);

async function computePermissions(req: NextApiRequest, res: NextApiResponse<PostCategoryPermissionFlags>) {
  const input = req.body as PermissionCompute;
  const permissions = await req.basePermissionsClient.forum.computePostCategoryPermissions({
    resourceId: input.resourceId,
    userId: req.session.user?.id
  });

  res.status(200).json(permissions);
}

export default withSessionRoute(handler);
