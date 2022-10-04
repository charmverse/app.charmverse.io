
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { hasAccessToSpace, onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireCustomPermissionMode } from 'lib/middleware/requireCustomPermissionMode';
import type { SpacePermissionFlags } from 'lib/permissions/spaces';
import { addSpaceOperations } from 'lib/permissions/spaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireCustomPermissionMode({
    keyLocation: 'query',
    spaceIdKey: 'spaceId'
  }))
  .post(addSpacePermissionsController);

async function addSpacePermissionsController (req: NextApiRequest, res: NextApiResponse<SpacePermissionFlags>) {

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

  return res.status(201).json(updatedPermissions);
}

export default withSessionRoute(handler);
