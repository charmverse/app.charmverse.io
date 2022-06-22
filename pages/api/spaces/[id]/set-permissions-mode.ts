
import { PagePermissionLevel, Space } from '@prisma/client';
import { hasAccessToSpace, onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { setSpaceDefaultPagePermission } from 'lib/spaces/setSpaceDefaultPagePermission';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { SpaceDefaultPublicPageToggle } from 'lib/permissions/pages';
import { toggleSpaceDefaultPublicPage } from 'lib/permissions/pages/actions/toggleSpaceDefaultPublicPage';
import { SpacePermissionConfigurationUpdate, updateSpacePermissionConfigurationMode } from 'lib/permissions/meta';

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
