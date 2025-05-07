import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import type { SpacePermissionFlags } from '@packages/lib/permissions/spaces';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(computeSpacePermissionsController);

async function computeSpacePermissionsController(req: NextApiRequest, res: NextApiResponse<SpacePermissionFlags>) {
  const { spaceId } = req.query as { spaceId: string };

  const { id: userId } = req.session.user;

  const computedPermissions = await permissionsApiClient.spaces.computeSpacePermissions({
    resourceId: spaceId,
    userId
  });

  return res.status(200).json(computedPermissions);
}

export default withSessionRoute(handler);
