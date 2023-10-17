import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    requireSpaceMembership({
      adminOnly: true,
      spaceIdKey: 'id'
    })
  )
  .use(
    providePermissionClients({
      key: 'id',
      location: 'query',
      resourceIdType: 'space'
    })
  )
  .post(setPublicBountyBoardController);

export type PublicRewardToggle = {
  publicRewardBoard: boolean;
};

async function setPublicBountyBoardController(req: NextApiRequest, res: NextApiResponse<Space>) {
  const { id: spaceId } = req.query;
  const { publicRewardBoard, publicBountyBoard } = req.body as PublicRewardToggle & { publicBountyBoard: boolean };

  // If this endpoint is being called, a manual update is happening. So we should update the space configuration mode to "custom"
  await prisma.space.update({
    where: {
      id: spaceId as string
    },
    data: {
      permissionConfigurationMode: 'custom'
    }
  });

  const updatedSpace = await req.premiumPermissionsClient.spaces.togglePublicBounties({
    publicBountyBoard: publicBountyBoard ?? publicRewardBoard,
    spaceId: spaceId as string
  });

  return res.status(200).json(updatedSpace);
}

export default withSessionRoute(handler);
