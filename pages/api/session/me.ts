import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { User } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(me);

async function me (req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: any }>) {
  const userId = req.session.user.id;
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      favorites: true,
      spaceRoles: true,
      discordUser: true
    }
  });

  if (!user) {
    // This shouldn't happen, it means the session cookie is storing a user that no longer exist in the database
    // Maybe the user got deleted, but its a very rare case
    return res.status(401).send({ error: '' });
  }

  return res.status(200).json(user);
}

export default withSessionRoute(handler);
