
import { Space } from '@prisma/client';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { PublicBountyToggle } from 'lib/spaces/interfaces';
import { togglePublicBounties } from 'lib/spaces/togglePublicBounties';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

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

  const updatedSpace = await togglePublicBounties({
    publicBountyBoard,
    spaceId: spaceId as string
  });

  return res.status(200).json(updatedSpace);
}

export default withSessionRoute(handler);
