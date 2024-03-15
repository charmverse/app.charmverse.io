import { log } from '@charmverse/core/log';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { isTestEnv } from 'config/constants';
import { loginByDiscord } from 'lib/discord/loginByDiscord';
import { updateGuildRolesForUser } from 'lib/guild-xyz/server/updateGuildRolesForUser';
import { extractSignupAnalytics } from 'lib/metrics/mixpanel/utilsSignup';
import { InvalidStateError, onError, onNoMatch, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys(['code'], 'body')).post(loginDiscordCodeHandler);

async function loginDiscordCodeHandler(
  req: NextApiRequest,
  res: NextApiResponse<LoggedInUser | { otpRequired: true }>
) {
  const tempAuthCode = req.body.code as string;

  try {
    const signupAnalytics = extractSignupAnalytics(req.cookies as any);
    const discordApiUrl = isTestEnv ? (req.body.discordApiUrl as string) : undefined;
    const user = await loginByDiscord({
      code: tempAuthCode,
      hostName: req.headers.host,
      userId: req.session.anonymousUserId,
      signupAnalytics,
      discordApiUrl,
      authFlowType: 'popup'
    });

    await updateGuildRolesForUser(
      user.wallets.map((w) => w.address),
      user.spaceRoles
    );

    req.session.anonymousUserId = undefined;

    if (user.otp?.activatedAt) {
      req.session.otpUser = { id: user.id, method: 'Discord' };
      await req.session.save();

      return res.status(200).json({ otpRequired: true });
    }

    req.session.user = { id: user.id };
    await req.session.save();

    log.info(`User ${user.id} logged in with Discord`, { userId: user.id, method: 'discord' });

    return res.status(200).json(user);
  } catch (error) {
    log.warn('Error while logging to Discord', error);

    throw new InvalidStateError('Failed to verify discord login');
  }
}

export default withSessionRoute(handler);
