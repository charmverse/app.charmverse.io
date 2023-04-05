import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { listPermissions } from 'lib/permissions/spaces/listPermissions';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership).get(listSpacePermissionsController);

async function listSpacePermissionsController(req: NextApiRequest, res: NextApiResponse) {
  const { spaceId } = req.query as { spaceId: string };

  const { id: userId } = req.session.user;

  const { error } = await hasAccessToSpace({
    spaceId,
    userId,
    adminOnly: false
  });

  if (error) {
    throw error;
  }
  const permissions = await listPermissions({ spaceId });

  return res.status(200).json(permissions);
}

export default withSessionRoute(handler);
