import type { PagePermissionLevel, Space } from '@charmverse/core/dist/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { setSpaceDefaultPagePermission } from 'lib/spaces/setSpaceDefaultPagePermission';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(setDefaultPagePermission);

async function setDefaultPagePermission(req: NextApiRequest, res: NextApiResponse<Space>) {
  const { id: spaceId } = req.query;
  const { pagePermissionLevel } = req.body as { pagePermissionLevel: PagePermissionLevel };

  const { error } = await hasAccessToSpace({
    userId: req.session.user.id as string,
    spaceId: spaceId as string,
    adminOnly: true
  });

  if (error) {
    throw error;
  }

  const updatedSpaceWithPermissions = await setSpaceDefaultPagePermission({
    spaceId: spaceId as string,
    defaultPagePermissionGroup: pagePermissionLevel
  });

  return res.status(200).json(updatedSpaceWithPermissions);
}

export default withSessionRoute(handler);
