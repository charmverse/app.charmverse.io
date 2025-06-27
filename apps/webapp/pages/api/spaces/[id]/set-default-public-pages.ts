import type { Space } from '@charmverse/core/prisma';
import type { SpaceDefaultPublicPageToggle } from '@packages/core/permissions';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { providePermissionClients } from '@packages/lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    providePermissionClients({
      key: 'id',
      location: 'query',
      resourceIdType: 'space'
    })
  )
  .use(
    requireSpaceMembership({
      spaceIdKey: 'id',
      adminOnly: true
    })
  )
  .post(setSpaceDefaultPublicPage);

async function setSpaceDefaultPublicPage(req: NextApiRequest, res: NextApiResponse<Space>) {
  const { id: spaceId } = req.query;
  const { defaultPublicPages } = req.body as Pick<SpaceDefaultPublicPageToggle, 'defaultPublicPages'>;

  const updatedSpace = await req.premiumPermissionsClient.spaces.toggleSpaceDefaultPublicPage({
    defaultPublicPages,
    spaceId: spaceId as string
  });

  return res.status(200).json(updatedSpace);
}

export default withSessionRoute(handler);
