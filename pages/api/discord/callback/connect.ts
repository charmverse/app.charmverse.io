import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import * as http from 'adapters/http';
import { prisma } from 'db';
import log from 'lib/log';
import { getDiscordToken } from 'lib/discord/getDiscordToken';

const handler = nc({
  onError,
  onNoMatch
});

interface DiscordApiUserResponse {
  id: string
  username: string
  discriminator: string
  avatar?: string
  verified?: boolean
}

// TODO: Add nonce for oauth state
// TODO: Add middleware for parsing oauth state
handler.get(async (req, res) => {
  const tempAuthCode = req.query.code as string;
  if (req.query.error || !tempAuthCode) {
    log.warn('Error or missing code from Discord OAuth. Response query:', req.query);
    res.redirect('/');
    return;
  }

  let state: {
    redirect: string,
    userId: string,
  } = {} as any;
  try {
    state = JSON.parse(decodeURIComponent(req.query.state as string));
  }
  catch (e) {
    log.warn('Error parsing discord state', e);
    // This is a rare case when we cant parse the state
    // That means we dont have access to the redirect url
    // Send user to the production app
    res.redirect('https://app.charmverse.io');
    return;
  }

  const url = new URL(state.redirect);

  // Remove discord=fail|success query parameter otherwise it query params would be duplicated
  if (url.searchParams.has('discord')) {
    url.searchParams.delete('discord');
  }

  if (!state.userId) {
    url.searchParams.append('discord', '3');
    res.redirect(url.href);
    return;
  }

  const token = await getDiscordToken(tempAuthCode, req.headers.host!.startsWith('localhost') ? `http://${req.headers.host}/api/discord/callback/connect` : 'https://app.charmverse.io/api/discord/callback/connect');
  const discordAccount = await http.GET<DiscordApiUserResponse>('https://discord.com/api/v8/users/@me', undefined, {
    headers: {
      Authorization: `Bearer ${token.access_token}`
    }
  });

  const { id, ...rest } = discordAccount;

  try {
    await prisma.discordUser.create({
      data: {
        account: rest as any,
        discordId: id,
        user: {
          connect: {
            id: state.userId
          }
        }
      }
    });

    await prisma.user.update({
      where: {
        id: state.userId
      },
      data: {
        username: discordAccount.username,
        avatar: `https://cdn.discordapp.com/avatars/${discordAccount.id}/${discordAccount.avatar}.png`
      }
    });
    url.searchParams.append('discord', '1');
  }
  catch (_) {
    // If the discord user is already connected to a charmverse account this code will be run
    // Add discord=fail to query parameter to show fail ux after redirecting
    url.searchParams.append('discord', '2');
  }
  res.redirect(url.href);
});

export default handler;
