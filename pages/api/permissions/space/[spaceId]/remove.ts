
import { hasAccessToSpace, onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { SpacePermissionWithAssignee, removeSpaceOperations, SpacePermissionFlags } from 'lib/permissions/spaces';
import { computeGroupSpacePermissions } from 'lib/permissions/spaces/computeGroupSpacePermissions';
import { requireCustomPermissionMode } from 'lib/middleware/requireCustomPermissionMode';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)

  .use(requireCustomPermissionMode({
    keyLocation: 'query',
    spaceIdKey: 'spaceId'
  }))
  .post(removeSpacePermissionsController);

async function removeSpacePermissionsController (req: NextApiRequest, res: NextApiResponse<SpacePermissionFlags>) {

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

  const result = await removeSpaceOperations({
    forSpaceId: spaceId as string,
    // Unwind operations and assigned group
    ...req.body
  });

  return res.status(200).json(result);
}

export default withSessionRoute(handler);
