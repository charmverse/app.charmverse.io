
import { hasAccessToSpace, onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';

import { AssignedPermissionsQuery } from 'lib/permissions/interfaces';
import { SpacePermissionFlags } from 'lib/permissions/spaces';
import { computeGroupSpacePermissions } from 'lib/permissions/spaces/computeGroupSpacePermissions';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .get(querySpacePermissionsController);

async function querySpacePermissionsController (req: NextApiRequest, res: NextApiResponse<SpacePermissionFlags>) {

  const { spaceId, group, id } = req.query as any as AssignedPermissionsQuery & {spaceId: string};

  const { id: userId } = req.session.user;

  const { error } = await hasAccessToSpace({
    spaceId: spaceId as string,
    userId,
    adminOnly: false
  });

  if (error) {
    throw error;
  }

  const spacePermissionFlags = await computeGroupSpacePermissions({
    group,
    id,
    resourceId: spaceId
  });

  return res.status(200).json(spacePermissionFlags);
}

export default withSessionRoute(handler);
