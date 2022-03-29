import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import log from 'lib/log';
import * as http from 'adapters/http';
import { getDiscordAccount } from 'lib/discord/getDiscordAccount';
import { prisma } from 'db';
import { logSignup } from '../profile';

const handler = nc({
  onError,
  onNoMatch
});

handler.get(async (req, res) => {
  const state = JSON.parse(decodeURIComponent(req.query.state as string));
  const redirect = state?.redirect;
  const type: 'connect' | 'server' | 'login' = state.type ?? 'connect';

  if (!redirect || !type) {
    const error = { error: 'Invalid state in discord callback' };
    log.warn('Error parsing state discord callback', error);
    // TODO: Error page
    res.status(400).send(error);
    return;
  }

  const tempAuthCode = req.query.code;
  if (req.query.error || !tempAuthCode) {
    res.redirect(
      `${redirect}?discord=2&type=${type}`
    );
    return;
  }

  // Create the charmverse user
  if (type === 'login') {
    const discordAccount = await getDiscordAccount(tempAuthCode as string, req.headers.host!.startsWith('localhost') ? `http://${req.headers.host}/api/discord/callback` : 'https://app.charmverse.io/api/discord/callback');
    const newUser = await prisma.user.create({
      data: {
        username: discordAccount.username,
        avatar: `https://cdn.discordapp.com/avatars/${discordAccount.id}/${discordAccount.avatar}.png`
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
              id: newUser.id
            }
          }
        }
      });
    }
    catch (error) {
      log.warn('Error while connecting to Discord', error);
      // discord=3 means failed to connect discord account with user
      res.redirect(`${redirect}?discord=3&type=login`);
      // If the discord user is already connected to a charmverse account this code will be run
      res.status(400).json({
        error: 'Connection to Discord failed. Another CharmVerse account is already associated with this Discord account.'
      });
      return;
    }
    logSignup();
    console.log(req.session);

    req.session.user = newUser;
    await req.session.save();
    res.redirect(redirect);
  }
  else {
    res.redirect(`${redirect}?code=${tempAuthCode}&discord=1&type=${type}`);
  }
});

export default handler;
