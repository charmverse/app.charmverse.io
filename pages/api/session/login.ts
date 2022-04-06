import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { User } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(login);

async function login (req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: any }>) {
  const { address } = req.body;
  const user = await prisma.user.findFirst({
    where: {
      addresses: {
        has: address
      }
    },
    include: {
      favorites: true,
      telegramUser: true,
      discordUser: true,
      spaceRoles: {
        include: {
          spaceRoleToRole: {
            include: {
              role: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    return res.status(401).send({ error: 'No user has been associated with this wallet address' });
  }

  // strip out large fields so we dont break the cookie
  const { discordUser, spaceRoles, telegramUser, ...userData } = user;
  req.session.user = userData;
  await req.session.save();

  return res.status(200).json(user);
}

export default withSessionRoute(handler);
