import type { Space } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import type { SpacePermissionConfigurationUpdate } from '@packages/lib/permissions/meta';
import { updateSpacePermissionConfigurationMode } from '@packages/lib/permissions/meta';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    requireSpaceMembership({
      adminOnly: true,
      spaceIdKey: 'id'
    })
  )
  .post(setPermissionsMode);

async function setPermissionsMode(req: NextApiRequest, res: NextApiResponse<Space>) {
  const { id: spaceId } = req.query;
  const { permissionConfigurationMode } = req.body as Pick<
    SpacePermissionConfigurationUpdate,
    'permissionConfigurationMode'
  >;

  const updatedSpace = await updateSpacePermissionConfigurationMode({
    permissionConfigurationMode,
    spaceId: spaceId as string
  });

  return res.status(200).json(updatedSpace);
}

export default withSessionRoute(handler);
