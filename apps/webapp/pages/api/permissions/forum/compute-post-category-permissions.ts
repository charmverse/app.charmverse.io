import type { PostCategoryPermissionFlags } from '@packages/core/permissions';
import { onError, onNoMatch, requireKeys } from '@packages/lib/middleware';
import { providePermissionClients } from '@packages/lib/permissions/api/permissionsClientMiddleware';
import type { PermissionCompute } from '@packages/lib/permissions/interfaces';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

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
