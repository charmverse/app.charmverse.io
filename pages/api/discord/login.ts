import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { prisma } from 'db';
import { NextApiRequest, NextApiResponse } from 'next';
import { withSessionRoute } from 'lib/session/withSession';
import log from 'lib/log';
import { getDiscordAccount } from 'lib/discord/getDiscordAccount';
import { LoggedInUser } from 'models';
import { DiscordAccount } from './connect';

const handler = nc({
  onError,
  onNoMatch
});

// TODO: Add nonce for oauth state
async function loginWithDiscord (req: NextApiRequest, res: NextApiResponse<LoggedInUser | {error: string}>) {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).json({
      error: 'Invalid parameters'
    });
    return;
  }

  let discordAccount: DiscordAccount;

  try {
    discordAccount = await getDiscordAccount(code, req.headers.host!.startsWith('localhost') ? `http://${req.headers.host}/api/discord/callback` : 'https://app.charmverse.io/api/discord/callback');
  }
  catch (error) {
    log.warn('Error while connecting to Discord', error);
    res.status(400).json({
      error: 'Invalid token'
    });
    return;
  }

  const discordUser = await prisma.discordUser.findUnique({
    where: {
      discordId: discordAccount.id
    }
  });

  if (discordUser) {
    const charmverseUser = await prisma.user.findUnique({
      where: {
        id: discordUser.userId
      },
      include: {
        favorites: true,
        spaceRoles: true,
        discordUser: true
      }
    });

    if (charmverseUser) {
      req.session.user = charmverseUser;
      await req.session.save();
      return res.status(200).json(charmverseUser);
    }
  }

  return res.status(404).json({ error: "User doesn't exist" });
}

handler.use(requireUser).get(loginWithDiscord);

export default withSessionRoute(handler);
