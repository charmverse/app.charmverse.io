
import { prisma } from 'db';
import { postToDiscord } from 'lib/logs/notifyDiscord';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { LoggedInUser } from 'models';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .post(createProfile)
  .use(requireUser)
  .get(getProfile);

async function createProfile (req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: any }>) {

  const { address } = req.body;
  const user = await prisma.user.findFirst({
    where: {
      addresses: {
        has: address
      }
    },
    include: {
      favorites: true,
      spaceRoles: true
    }
  });

  if (user) {
    req.session.user = user;
    await req.session.save();
    res.status(200).json(user);
  }
  else {
    const newUser = await prisma.user.create({
      data: {
        addresses: [address]
      },
      include: {
        favorites: true,
        spaceRoles: true
      }
    });

    logSignup();

    req.session.user = newUser;
    await req.session.save();
    res.status(200).json(newUser);
  }
}

async function getProfile (req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: any }>) {

  const profile = await prisma.user.findUnique({
    where: {
      id: req.session.user.id
    },
    include: {
      favorites: true,
      spaceRoles: true,
      discordUser: true
    }
  });
  if (!profile) {
    return res.status(404).json({ error: 'No user found' });
  }
  return res.status(200).json(profile);
}

export default withSessionRoute(handler);

async function logSignup () {

  postToDiscord({
    funnelStage: 'acquisition',
    eventType: 'create_user',
    message: 'A new user has joined Charmverse'
  });
}
