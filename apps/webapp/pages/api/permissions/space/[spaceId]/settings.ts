import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { requirePaidPermissionsSubscription } from '@packages/lib/middleware/requirePaidPermissionsSubscription';
import type { SpacePermissions } from '@packages/lib/permissions/spaces/listPermissions';
import { listPermissions } from '@packages/lib/permissions/spaces/listPermissions';
import { saveRoleAndSpacePermissions } from '@packages/lib/permissions/spaces/saveRoleAndSpacePermissions';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership())
  .use(
    requirePaidPermissionsSubscription({
      key: 'spaceId',
      resourceIdType: 'space',
      location: 'query'
    })
  )
  .get(listSpacePermissionsController)
  .use(requireSpaceMembership({ adminOnly: true }))
  .post(updateSpacePermissionsController);

async function listSpacePermissionsController(req: NextApiRequest, res: NextApiResponse) {
  const { spaceId } = req.query as { spaceId: string };

  const permissions = await listPermissions({ spaceId });

  return res.status(200).json(permissions);
}

async function updateSpacePermissionsController(req: NextApiRequest, res: NextApiResponse) {
  const { spaceId } = req.query as { spaceId: string };
  const { roleIdToTrack, ...permissions } = req.body as SpacePermissions & { roleIdToTrack?: string };

  await saveRoleAndSpacePermissions(spaceId, permissions);

  // tracking
  if (roleIdToTrack) {
    const role = await prisma.role.findFirst({
      where: {
        id: roleIdToTrack
      }
    });
    // TODO: we are not tracking if user removes permissions to rely on defaults
    const spacePermissions = permissions.space.find((p) => p.assignee.id === roleIdToTrack);
    if (role && spacePermissions) {
      trackUserAction('update_role_permissions', {
        spaceId: spaceId as string,
        userId: req.session.user.id,
        name: role.name,
        ...spacePermissions.operations
      });
    }
  }

  return res.status(200).end();
}

export default withSessionRoute(handler);
