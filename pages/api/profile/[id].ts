
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { Space } from '@prisma/client';
import { prisma } from 'db';
import { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updateUser);

async function updateUser (req: NextApiRequest, res: NextApiResponse<LoggedInUser>) {
  const user = await prisma.user.update({
    where: {
      id: req.query.id as string
    },
    include: {
      favorites: true,
      spaceRoles: true,
      discordUser: true
    },
    data: {
      addresses: [req.body.address]
    }
  });
  return res.status(200).json(user);
}

export default withSessionRoute(handler);
