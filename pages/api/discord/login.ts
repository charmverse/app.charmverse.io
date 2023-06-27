import { log } from '@charmverse/core/log';
import Cookies from 'cookies';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { AUTH_CODE_COOKIE } from 'lib/discord/constants';
import { loginByDiscord } from 'lib/discord/loginByDiscord';
import { updateGuildRolesForUser } from 'lib/guild-xyz/server/updateGuildRolesForUser';
import { extractSignupAnalytics } from 'lib/metrics/mixpanel/utilsSignup';
import { InvalidStateError, onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getAppApexDomain } from 'lib/utilities/domains/getAppApexDomain';
import { isLocalhostAlias } from 'lib/utilities/domains/isLocalhostAlias';
import type { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(loginDiscordCodeHandler);

async function loginDiscordCodeHandler(req: NextApiRequest, res: NextApiResponse<LoggedInUser>) {
  const cookies = new Cookies(req, res);
  const tempAuthCode = req.body.code as string;
  const domain = isLocalhostAlias(req.headers.host) ? undefined : getAppApexDomain();

  cookies.set(AUTH_CODE_COOKIE, tempAuthCode, { httpOnly: false, sameSite: 'strict', domain });

  try {
    const signupAnalytics = extractSignupAnalytics(req.cookies as any);
    const user = await loginByDiscord({
      code: tempAuthCode,
      hostName: req.headers.host,
      userId: req.session.anonymousUserId,
      signupAnalytics,
      authFlowType: 'popup'
    });

    req.session.anonymousUserId = undefined;
    req.session.user = { id: user.id };

    await updateGuildRolesForUser(
      user.wallets.map((w) => w.address),
      user.spaceRoles
    );

    await req.session.save();

    return res.status(200).json(user);
  } catch (error) {
    log.warn('Error while logging to Discord', error);

    throw new InvalidStateError('Failed to verify discord login');
  }
}

export default withSessionRoute(handler);
