
import { prisma } from 'db';
import { updateGuildRolesForUser } from 'lib/guild-xyz/server/updateGuildRolesForUser';
import { postToDiscord } from 'lib/log/userEvents';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { createUserFromWallet } from 'lib/users/createUser';
import { getUserProfile } from 'lib/users/getUser';
import { LoggedInUser } from 'models';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .post(createUser)
  .use(requireUser)
  .get(getUser)
  .put(updateUser);

async function createUser (req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: any }>) {

  const { address } = req.body;

  let user: LoggedInUser;

  try {
    user = await getUserProfile('addresses', address);
  }
  catch {
    user = await createUserFromWallet(address);
    logSignup();
  }

  const { discordUser, spaceRoles, telegramUser, ...userData } = user;
  req.session.user = userData;
  await updateGuildRolesForUser(userData.addresses, spaceRoles);
  await req.session.save();
  res.status(200).json(user);
}

async function getUser (req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: any }>) {
  const profile = await prisma.user.findUnique({
    where: {
      id: req.session.user.id
    },
    include: {
      favorites: true,
      spaceRoles: {
        include: {
          spaceRoleToRole: {
            include: {
              role: true
            }
          }
        }
      },
      discordUser: true,
      telegramUser: true,
      notificationState: true
    }
  });
  if (!profile) {
    return res.status(404).json({ error: 'No user found' });
  }
  return res.status(200).json(profile);
}

async function updateUser (req: NextApiRequest, res: NextApiResponse<LoggedInUser | {error: string}>) {

  const user = await prisma.user.update({
    where: {
      id: req.session.user.id
    },
    include: {
      favorites: true,
      spaceRoles: {
        include: {
          spaceRoleToRole: {
            include: {
              role: true
            }
          }
        }
      },
      discordUser: true,
      telegramUser: true
    },
    data: {
      ...req.body
    }
  });

  return res.status(200).json(user);
}

export default withSessionRoute(handler);

export async function logSignup () {
  postToDiscord({
    funnelStage: 'acquisition',
    eventType: 'create_user',
    message: 'A new user has joined Charmverse'
  });
}
