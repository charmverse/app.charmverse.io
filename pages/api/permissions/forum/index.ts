import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computePostCategoryPermissions } from 'lib/permissions/forum/computePostCategoryPermissions';
import { deletePostCategoryPermission } from 'lib/permissions/forum/deletePostCategoryPermission';
import type { AssignedPostCategoryPermission } from 'lib/permissions/forum/interfaces';
import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';
import type { PermissionToDelete } from 'lib/permissions/interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .delete(requireKeys<PermissionToDelete>(['permissionId'], 'body'), removePostCategoryPermission)
  .post(upsertPostCategoryPermissionController);

async function upsertPostCategoryPermissionController(
  req: NextApiRequest,
  res: NextApiResponse<AssignedPostCategoryPermission>
) {
  const input = req.body as AssignedPostCategoryPermission;

  const permissions = await computePostCategoryPermissions({
    resourceId: input.postCategoryId,
    userId: req.session.user.id
  });

  if (!permissions.manage_permissions) {
    throw new ActionNotPermittedError('You cannot manage permissions for this category.');
  }

  const newPermission = await upsertPostCategoryPermission(input);

  res.status(201).json(newPermission);
}

async function removePostCategoryPermission(req: NextApiRequest, res: NextApiResponse) {
  const { permissionId } = req.body as PermissionToDelete;

  const postCategory = await prisma.postCategory.findFirst({
    where: {
      postCategoryPermissions: {
        some: {
          id: permissionId
        }
      }
    }
  });

  if (!postCategory) {
    throw new DataNotFoundError('Post category not found');
  }

  const permissions = await computePostCategoryPermissions({
    resourceId: postCategory.id,
    userId: req.session.user.id
  });

  if (!permissions.manage_permissions) {
    throw new ActionNotPermittedError('You cannot manage permissions for this category.');
  }

  await deletePostCategoryPermission({ permissionId });

  res.status(200).json({ success: true });
}

export default withSessionRoute(handler);
