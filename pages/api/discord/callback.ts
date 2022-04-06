import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import loginByDiscord from 'lib/discord/loginByDiscord';
import log from 'lib/log';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc({
  onError,
  onNoMatch
});

handler.get(async (req, res) => {
  const state = JSON.parse(decodeURIComponent(req.query.state as string));
  const redirect = state?.redirect || '/';
  const type: 'connect' | 'server' | 'login' = state.type ?? 'connect';

  const tempAuthCode = req.query.code;
  if (req.query.error || typeof tempAuthCode !== 'string') {
    res.redirect(
      `${redirect}?discord=2&type=${type}`
    );
    return;
  }

  if (type === 'login') {
    try {
      const user = await loginByDiscord({ code: tempAuthCode, hostName: req.headers.host });
      // strip out large fields so we dont break the cookie
      const { discordUser, spaceRoles, telegramUser, ...userData } = user;
      req.session.user = userData;
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

  // When login with discord ?returnUrl is passed after oauth flow, that messes up the whole url
  res.redirect(`${redirect.split('?')[0]}?code=${tempAuthCode}&discord=1&type=${type}${req.query.guild_id ? `&guild_id=${req.query.guild_id}` : ''}`);
});

export default withSessionRoute(handler);
