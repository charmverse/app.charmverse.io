import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import log from 'lib/log';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireCustomPermissionMode } from 'lib/middleware/requireCustomPermissionMode';
import type { SpacePermissionFlags } from 'lib/permissions/spaces';
import { removeSpaceOperations } from 'lib/permissions/spaces';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    requireCustomPermissionMode({
      keyLocation: 'query',
      spaceIdKey: 'spaceId'
    })
  )
  .post(removeSpacePermissionsController);

async function removeSpacePermissionsController(req: NextApiRequest, res: NextApiResponse<SpacePermissionFlags>) {
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

  log.debug('Removing space permissions', { spaceId: req.body.spaceId, operations: req.body.operations });

  const result = await removeSpaceOperations({
    forSpaceId: spaceId as string,
    // Unwind operations and assigned group
    ...req.body
  });

  return res.status(200).json(result);
}

export default withSessionRoute(handler);
