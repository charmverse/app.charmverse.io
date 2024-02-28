import type { UpdatePagePermissionDiscoverabilityRequest } from '@charmverse/core/pages';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireKeys } from 'lib/middleware';
import { requirePaidPermissionsSubscription } from 'lib/middleware/requirePaidPermissionsSubscription';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utils/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireKeys<UpdatePagePermissionDiscoverabilityRequest>(['permissionId', 'allowDiscovery'], 'body'))
  .put(
    requirePaidPermissionsSubscription({ key: 'permissionId', location: 'body', resourceIdType: 'pagePermission' }),
    updateDiscoverability
  );

//
async function updateDiscoverability(req: NextApiRequest, res: NextApiResponse<void>) {
  const input = req.body as UpdatePagePermissionDiscoverabilityRequest;

  const permissionData = await prisma.pagePermission.findUnique({
    where: { id: input.permissionId },
    select: { public: true, pageId: true, allowDiscovery: true }
  });

  if (!permissionData) {
    throw new DataNotFoundError(input.permissionId);
  }

  const computedPermissions = await req.premiumPermissionsClient.pages.computePagePermissions({
    resourceId: permissionData.pageId,
    userId: req.session.user.id
  });

  if (
    (permissionData.public && computedPermissions.edit_isPublic !== true) ||
    (!permissionData.public && computedPermissions.grant_permissions !== true)
  ) {
    throw new ActionNotPermittedError('You cannot manage permissions for this page');
  }

  await req.premiumPermissionsClient.pages.updatePagePermissionDiscoverability({
    permissionId: input.permissionId,
    allowDiscovery: input.allowDiscovery
  });

  res.status(200).end();
}

export default withSessionRoute(handler);
