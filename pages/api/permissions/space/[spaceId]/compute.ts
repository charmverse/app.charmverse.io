
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { SpacePermissionFlags } from 'lib/permissions/spaces';
import { computeSpacePermissions } from 'lib/permissions/spaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .get(computeSpacePermissionsController);

async function computeSpacePermissionsController (req: NextApiRequest, res: NextApiResponse<SpacePermissionFlags>) {

  const { spaceId } = req.query as { spaceId: string };

  const { id: userId } = req.session.user;

  const computedPermissions = await computeSpacePermissions({
    allowAdminBypass: true,
    resourceId: spaceId,
    userId
  });

  return res.status(200).json(computedPermissions);
}

export default withSessionRoute(handler);
