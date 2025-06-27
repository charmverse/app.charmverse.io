import type { AssignedPostCategoryPermission } from '@packages/core/permissions';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { listPostCategoryPermissions } from '@packages/lib/permissions/forum/listPostCategoryPermissions';
import type { PermissionCompute } from '@packages/lib/permissions/interfaces';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { InvalidInputError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(listPermissions);

async function listPermissions(req: NextApiRequest, res: NextApiResponse<AssignedPostCategoryPermission[]>) {
  const input = req.query as PermissionCompute;

  if (!input.resourceId) {
    throw new InvalidInputError('Please provide a category Id or a space Id');
  }

  const permissions = await listPostCategoryPermissions({
    resourceId: input.resourceId,
    userId: req.session.user.id
  });

  res.status(200).json(permissions);
}

export default withSessionRoute(handler);
