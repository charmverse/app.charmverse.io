import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import loginByDiscord from 'lib/discord/loginByDiscord';
import log from 'lib/log';
import { withSessionRoute } from 'lib/session/withSession';
import { updateGuildRolesForUser } from 'lib/guild-xyz/server/updateGuildRolesForUser';
import { AUTH_CODE_COOKIE, AUTH_ERROR_COOKIE } from 'lib/discord/constants';
import Cookies from 'cookies';

const handler = nc({
  onError,
  onNoMatch
});

handler.get(async (req, res) => {
  const state = JSON.parse(decodeURIComponent(req.query.state as string));
  const redirect = state?.redirect || '/';
  const type: 'connect' | 'server' | 'login' = state.type ?? 'connect';

  const cookies = new Cookies(req, res);

  const tempAuthCode = req.query.code;
  if (req.query.error || typeof tempAuthCode !== 'string') {
    log.warn('Error importing from notion', req.query);
    cookies.set(AUTH_ERROR_COOKIE, 'There was an error from Discord. Please try again', { httpOnly: false, sameSite: 'strict' });
    res.redirect(
      `${redirect}?discord=2&type=${type}`
    );
    return;
  }

  if (type === 'login') {
    try {
      const user = await loginByDiscord({ code: tempAuthCode, hostName: req.headers.host });
      // strip out large fields so we dont break the cookie
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { discordUser, spaceRoles, telegramUser, ...userData } = user;
      req.session.user = userData;
      await updateGuildRolesForUser(userData.addresses, spaceRoles);
    }
    catch (error) {
      log.warn('Error while connecting to Discord', error);
      res.status(400).json({
        error: 'Invalid token'
      });
      return;
    }
    await req.session.save();
    return res.redirect(redirect);
  }

  cookies.set(AUTH_CODE_COOKIE, tempAuthCode, { httpOnly: false, sameSite: 'strict' });

  // When login with discord ?returnUrl is passed after oauth flow, that messes up the whole url
  res.redirect(`${redirect.split('?')[0]}?code=${tempAuthCode}&discord=1&type=${type}${req.query.guild_id ? `&guild_id=${req.query.guild_id}` : ''}`);
});

export default withSessionRoute(handler);
