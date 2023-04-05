import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { AssignedPostCategoryPermission } from 'lib/permissions/forum/interfaces';
import { listPostCategoryPermissions } from 'lib/permissions/forum/listPostCategoryPermissions';
import { listPostCategoryPermissionsBySpace } from 'lib/permissions/forum/listPostCategoryPermissionsBySpace';
import type { PermissionCompute } from 'lib/permissions/interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(listPermissions);

async function listPermissions(req: NextApiRequest, res: NextApiResponse<AssignedPostCategoryPermission[]>) {
  const input = req.query as PermissionCompute & { categoryId?: string; spaceId?: string };

  const categoryId = input.categoryId || input.resourceId;

  let permissions: AssignedPostCategoryPermission[] = [];

  if (categoryId) {
    permissions = await listPostCategoryPermissions({
      resourceId: categoryId,
      userId: req.session.user.id
    });
  } else if (input.spaceId) {
    // check access to space
    const { error } = await hasAccessToSpace({
      spaceId: input.spaceId,
      userId: req.session.user.id
    });
    if (error) {
      throw error;
    }
    permissions = await listPostCategoryPermissionsBySpace({
      spaceId: input.spaceId
    });
  } else {
    throw new InvalidInputError('Please provide a category Id or a space Id');
  }
  res.status(200).json(permissions);
}

export default withSessionRoute(handler);
