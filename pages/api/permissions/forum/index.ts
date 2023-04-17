import { prisma } from '@charmverse/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { requirePaidPermissionsSubscription } from 'lib/middleware/requirePaidPermissionsSubscription';
import { premiumPermissionsApiClient } from 'lib/permissions/api/routers';
import type { AssignedPostCategoryPermission } from 'lib/permissions/forum/interfaces';
import type { PermissionToDelete } from 'lib/permissions/interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .delete(
    requirePaidPermissionsSubscription({
      key: 'permissionId',
      location: 'body',
      resourceIdType: 'postCategoryPermission'
    }),
    removePostCategoryPermission
  )
  .post(
    requirePaidPermissionsSubscription({
      key: 'postCategoryId',
      location: 'body',
      resourceIdType: 'postCategory'
    }),
    upsertPostCategoryPermissionController
  );

async function upsertPostCategoryPermissionController(
  req: NextApiRequest,
  res: NextApiResponse<AssignedPostCategoryPermission>
) {
  const input = req.body as AssignedPostCategoryPermission;

  const permissions = await premiumPermissionsApiClient.forum.computePostCategoryPermissions({
    resourceId: input.postCategoryId,
    userId: req.session.user.id
  });

  if (!permissions.manage_permissions) {
    throw new ActionNotPermittedError('You cannot manage permissions for this category.');
  }

  const newPermission = await premiumPermissionsApiClient.forum.upsertPostCategoryPermission(input);

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

  const permissions = await premiumPermissionsApiClient.forum.computePostCategoryPermissions({
    resourceId: postCategory.id,
    userId: req.session.user.id
  });

  if (!permissions.manage_permissions) {
    throw new ActionNotPermittedError('You cannot manage permissions for this category.');
  }

  await premiumPermissionsApiClient.forum.deletePostCategoryPermission({ permissionId });

  res.status(200).json({ success: true });
}

export default withSessionRoute(handler);
