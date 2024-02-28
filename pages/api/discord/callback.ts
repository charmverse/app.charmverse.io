import { log } from '@charmverse/core/log';
import Cookies from 'cookies';
import nc from 'next-connect';

import { isTestEnv } from 'config/constants';
import { AUTH_CODE_COOKIE, AUTH_ERROR_COOKIE } from 'lib/discord/constants';
import { getDiscordRedirectUrl } from 'lib/discord/getDiscordRedirectUrl';
import { loginByDiscord } from 'lib/discord/loginByDiscord';
import { updateGuildRolesForUser } from 'lib/guild-xyz/server/updateGuildRolesForUser';
import { extractSignupAnalytics } from 'lib/metrics/mixpanel/utilsSignup';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getSpaceDomainFromHost } from 'lib/utils/domains/getSpaceDomainFromHost';
import { DisabledAccountError } from 'lib/utils/errors';

const handler = nc({
  onError,
  onNoMatch
});

handler.get(async (req, res) => {
  const cookies = new Cookies(req, res);
  const state = JSON.parse(decodeURIComponent(req.query.state as string));
  const type: 'connect' | 'server' | 'login' = state.type ?? 'connect';
  // sanitize the redirect path in case of invalid characters
  const redirectPath = (state?.redirect as string) || '/';
  const redirectUrl = getDiscordRedirectUrl(req.headers.host, redirectPath);
  const subdomain = getSpaceDomainFromHost(redirectUrl.host);
  const redirect = subdomain ? redirectPath : redirectUrl.pathname + redirectUrl.search;
  const tempAuthCode = req.query.code;

  if (req.query.error || typeof tempAuthCode !== 'string') {
    log.warn('Error importing from notion', req.query);
    cookies.set(AUTH_ERROR_COOKIE, 'There was an error from Discord. Please try again', {
      httpOnly: false,
      sameSite: 'strict'
    });
    res.redirect(`${redirect}?discord=2&type=${type}`);
    return;
  }

  cookies.set(AUTH_CODE_COOKIE, tempAuthCode, { httpOnly: false, sameSite: 'strict' });

  if (type === 'login') {
    try {
      const signupAnalytics = extractSignupAnalytics(req.cookies as any);

      const discordApiUrl = isTestEnv ? (req.query.discordApiUrl as string) : undefined;
      const user = await loginByDiscord({
        code: tempAuthCode,
        hostName: req.headers.host,
        discordApiUrl,
        userId: req.session.anonymousUserId,
        signupAnalytics
      });

      await updateGuildRolesForUser(
        user.wallets.map((w) => w.address),
        user.spaceRoles
      );

      req.session.anonymousUserId = undefined;

      if (user.otp?.activatedAt) {
        req.session.otpUser = { id: user.id, method: 'Discord' };
        await req.session.save();

        return res.redirect('/authenticate/otp');
      }

      req.session.user = { id: user.id };
      await req.session.save();

      return res.redirect(redirect);
    } catch (error) {
      log.warn('Error while connecting to Discord', error);

      const errorContent =
        error instanceof DisabledAccountError ? error.errorType : 'There was an error from Discord. Please try again';
      const redirectWithError = `/?discordError=${errorContent}`;

      return res.redirect(redirectWithError);
    }
  }

  const urlSearchParams = new URLSearchParams();

  if (req.query.guild_id) {
    urlSearchParams.append('guild_id', req.query.guild_id as string);
    urlSearchParams.append('type', 'import-roles');
  }

  // When login with discord ?returnUrl is passed after oauth flow, that messes up the whole url
  res.redirect(`${redirect.split('?')[0]}${urlSearchParams.size ? `?${urlSearchParams.toString()}` : ''}`);
});

export default withSessionRoute(handler);
