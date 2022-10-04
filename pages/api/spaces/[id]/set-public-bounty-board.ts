
import type { Space } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { PublicBountyToggle } from 'lib/spaces/interfaces';
import { togglePublicBounties } from 'lib/spaces/togglePublicBounties';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireSpaceMembership({
    adminOnly: true,
    spaceIdKey: 'id'
  }))
  .post(setPublicBountyBoardController);

async function setPublicBountyBoardController (req: NextApiRequest, res: NextApiResponse<Space>) {

  const { id: spaceId } = req.query;
  const { publicBountyBoard } = req.body as Pick<PublicBountyToggle, 'publicBountyBoard'>;

  // If this endpoint is being called, a manual update is happening. So we should update the space configuration mode to "custom"
  await prisma.space.update({
    where: {
      id: spaceId as string
    },
    data: {
      permissionConfigurationMode: 'custom'
    }
  });

  const updatedSpace = await togglePublicBounties({
    publicBountyBoard,
    spaceId: spaceId as string
  });

  return res.status(200).json(updatedSpace);
}

export default withSessionRoute(handler);
