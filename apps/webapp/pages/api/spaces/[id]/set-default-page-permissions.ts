import type { PagePermissionLevel, Space } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { requirePaidPermissionsSubscription } from '@packages/lib/middleware/requirePaidPermissionsSubscription';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { setSpaceDefaultPagePermission } from 'lib/spaces/setSpaceDefaultPagePermission';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    requirePaidPermissionsSubscription({
      key: 'id',
      location: 'query',
      resourceIdType: 'space'
    })
  )
  .use(requireSpaceMembership({ spaceIdKey: 'id', adminOnly: true }))
  .post(setDefaultPagePermission);

async function setDefaultPagePermission(req: NextApiRequest, res: NextApiResponse<Space>) {
  const { id: spaceId } = req.query;
  const { pagePermissionLevel } = req.body as { pagePermissionLevel: PagePermissionLevel };
  const updatedSpaceWithPermissions = await setSpaceDefaultPagePermission({
    spaceId: spaceId as string,
    defaultPagePermissionGroup: pagePermissionLevel
  });

  return res.status(200).json(updatedSpaceWithPermissions);
}

export default withSessionRoute(handler);
