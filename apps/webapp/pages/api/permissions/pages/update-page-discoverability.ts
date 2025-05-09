import type { UpdatePagePermissionDiscoverabilityRequest } from '@charmverse/core/pages';
import { prisma } from '@charmverse/core/prisma-client';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys } from '@packages/lib/middleware';
import { requirePaidPermissionsSubscription } from '@packages/lib/middleware/requirePaidPermissionsSubscription';
import { withSessionRoute } from '@packages/lib/session/withSession';

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

  const permissionData = await prisma.pagePermission.findUniqueOrThrow({
    where: { id: input.permissionId },
    select: { public: true, pageId: true, allowDiscovery: true }
  });

  const computedPermissions = await req.premiumPermissionsClient.pages.computePagePermissions({
    resourceId: permissionData.pageId,
    userId: req.session.user.id
  });

  if (!computedPermissions.grant_permissions) {
    throw new ActionNotPermittedError('You cannot manage permissions for this page');
  }

  await req.premiumPermissionsClient.pages.updatePagePermissionDiscoverability({
    permissionId: input.permissionId,
    allowDiscovery: input.allowDiscovery
  });

  res.status(200).end();
}

export default withSessionRoute(handler);
