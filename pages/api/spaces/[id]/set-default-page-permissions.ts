
import { PagePermissionLevel } from '@prisma/client';
import { prisma } from 'db';
import { hasAccessToSpace, onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { PublicSpaceInfo } from 'lib/spaces/interfaces';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(setDefaultPagePermission);

async function setDefaultPagePermission (req: NextApiRequest, res: NextApiResponse<PublicSpaceInfo>) {

  const { id: spaceId } = req.query;
  const { pagePermissionLevel } = req.body as {pagePermissionLevel: PagePermissionLevel};

  const {
    error
  } = await hasAccessToSpace({
    userId: req.session.user.id as string,
    spaceId: spaceId as string,
    adminOnly: true
  });

  if (error) {
    throw error;
  }
  const updatedSpace = await prisma.space.update({
    where: {
      id: spaceId as string
    },
    data: {
      defaultPagePermissionGroup: pagePermissionLevel
    }
  });

  return res.status(200).json(updatedSpace);
}

export default withSessionRoute(handler);
