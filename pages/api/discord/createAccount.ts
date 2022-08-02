import { getDiscordAccount } from 'lib/discord/getDiscordAccount';
import { onError, onNoMatch } from 'lib/middleware';
import log from 'loglevel';
import { IDENTITY_TYPES, LoggedInUser } from 'models';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { prisma } from 'db';
import { withSessionRoute } from 'lib/session/withSession';
import { DiscordUser } from '@prisma/client';
import { postToDiscord } from 'lib/log/userEvents';

const handler = nc({
  onError,
  onNoMatch
});

export async function createAccountWithDiscord (req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: any }>) {
  const { code } = req.body as {code: string};
  const discordAccount = await getDiscordAccount(code as string, req.headers.host?.startsWith('localhost') ? `http://${req.headers.host}/api/discord/callback` : 'https://app.charmverse.io/api/discord/callback');
  const newUser = await prisma.user.create({
    data: {
      username: discordAccount.username,
      avatar: `https://cdn.discordapp.com/avatars/${discordAccount.id}/${discordAccount.avatar}.png`,
      identityType: IDENTITY_TYPES[1]
    }
  });

  let discordUser: DiscordUser;
  const { id, ...rest } = discordAccount;
  try {
    discordUser = await prisma.discordUser.create({
      data: {
        account: rest as any,
        discordId: id,
        user: {
          connect: {
            id: newUser.id
          }
        }
      }
    });
  }
  catch (error) {
    log.warn('Error while connecting to Discord', error);
    // If the discord user is already connected to a charmverse account this code will be run
    res.status(400).json({
      error: 'Connection to Discord failed. Another CharmVerse account is already associated with this Discord account.'
    });
    return;
  }

  req.session.user = newUser;
  await req.session.save();
  res.status(200).json({
    ...newUser,
    ensName: undefined,
    discordUser,
    spaceRoles: [],
    favorites: []
  });
}

handler.post(createAccountWithDiscord);

export default withSessionRoute(handler);

export async function logSignupViaDiscord () {
  postToDiscord({
    funnelStage: 'acquisition',
    eventType: 'create_user',
    message: 'A new user has joined Charmverse using their Discord account'
  });
}
