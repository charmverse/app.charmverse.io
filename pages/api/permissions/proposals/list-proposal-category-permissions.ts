import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { PermissionCompute } from 'lib/permissions/interfaces';
import type { AssignedProposalCategoryPermission } from 'lib/permissions/proposals/interfaces';
import { listProposalCategoryPermissions } from 'lib/permissions/proposals/listProposalCategoryPermissions';
import { listProposalCategoryPermissionsBySpace } from 'lib/permissions/proposals/listProposalCategoryPermissionsBySpace';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(listPermissions);

async function listPermissions(req: NextApiRequest, res: NextApiResponse<AssignedProposalCategoryPermission[]>) {
  const input = req.query as PermissionCompute & { categoryId?: string; spaceId?: string };

  const categoryId = input.categoryId || input.resourceId;

  let permissions: AssignedProposalCategoryPermission[] = [];

  if (categoryId) {
    permissions = await listProposalCategoryPermissions({
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
    permissions = await listProposalCategoryPermissionsBySpace({
      spaceId: input.spaceId
    });
  } else {
    throw new InvalidInputError('Please provide a category Id or a space Id');
  }

  res.status(200).json(permissions);
}

export default withSessionRoute(handler);
