import type { AssignedPostCategoryPermission } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { requirePaidPermissionsSubscription } from 'lib/middleware/requirePaidPermissionsSubscription';
import { permissionsApiClient } from 'lib/permissions/api/routers';
import type { PermissionResource } from 'lib/permissions/interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .delete(
    requirePaidPermissionsSubscription({
      key: 'permissionId',
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

  const permissions = await permissionsApiClient.forum.computePostCategoryPermissions({
    resourceId: input.postCategoryId,
    userId: req.session.user.id
  });

  if (!permissions.manage_permissions) {
    throw new ActionNotPermittedError('You cannot manage permissions for this category.');
  }

  const newPermission = await permissionsApiClient.forum.upsertPostCategoryPermission(input);

  res.status(201).json(newPermission);
}

async function removePostCategoryPermission(req: NextApiRequest, res: NextApiResponse) {
  // TODO: remove check on req.body after browsers update - 06/2023
  const { permissionId } = (req.query || req.body) as PermissionResource;

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

  const permissions = await permissionsApiClient.forum.computePostCategoryPermissions({
    resourceId: postCategory.id,
    userId: req.session.user.id
  });

  if (!permissions.manage_permissions) {
    throw new ActionNotPermittedError('You cannot manage permissions for this category.');
  }

  await permissionsApiClient.forum.deletePostCategoryPermission({ permissionId });

  res.status(200).json({ success: true });
}

export default withSessionRoute(handler);
