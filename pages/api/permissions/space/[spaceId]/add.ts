import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import log from 'lib/log';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { SpacePermissionFlags } from 'lib/permissions/spaces';
import { addSpaceOperations } from 'lib/permissions/spaces';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(addSpacePermissionsController);

async function addSpacePermissionsController(req: NextApiRequest, res: NextApiResponse<SpacePermissionFlags>) {
  const { spaceId } = req.query;
  const { id: userId } = req.session.user;

  const { error } = await hasAccessToSpace({
    spaceId: spaceId as string,
    userId,
    adminOnly: true
  });

  if (error) {
    throw error;
  }

  const updatedPermissions = await addSpaceOperations({
    forSpaceId: spaceId as string,
    // Unwind operations and assigned group
    ...req.body
  });

  log.debug('Adding space permissions', { spaceId: req.body.spaceId, operations: req.body.operations, userId });

  // tracking
  if (req.body.roleId) {
    const role = await prisma.role.findFirst({
      where: {
        id: req.body.roleId
      }
    });
    if (role) {
      trackUserAction('update_role_permissions', {
        spaceId: spaceId as string,
        userId,
        name: role.name,
        ...updatedPermissions
      });
    }
  }

  return res.status(201).json(updatedPermissions);
}

export default withSessionRoute(handler);
