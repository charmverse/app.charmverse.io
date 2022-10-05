
import type { Space } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import type { SpacePermissionConfigurationUpdate } from 'lib/permissions/meta';
import { updateSpacePermissionConfigurationMode } from 'lib/permissions/meta';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireSpaceMembership({
    adminOnly: true,
    spaceIdKey: 'id'
  }))
  .post(setPermissionsMode);

async function setPermissionsMode (req: NextApiRequest, res: NextApiResponse<Space>) {

  const { id: spaceId } = req.query;
  const { permissionConfigurationMode } = req.body as Pick<SpacePermissionConfigurationUpdate, 'permissionConfigurationMode'>;

  const updatedSpace = await updateSpacePermissionConfigurationMode({
    permissionConfigurationMode,
    spaceId: spaceId as string
  });

  return res.status(200).json(updatedSpace);
}

export default withSessionRoute(handler);
