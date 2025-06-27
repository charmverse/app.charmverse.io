import { isTestEnv } from '@packages/config/constants';
import { log } from '@packages/core/log';
import { loginByDiscord } from '@packages/lib/discord/loginByDiscord';
import { updateGuildRolesForUser } from '@packages/lib/guild-xyz/server/updateGuildRolesForUser';
import { onError, onNoMatch, requireKeys } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { trackOpSpaceSuccessfulSigninEvent } from '@packages/metrics/mixpanel/trackOpSpaceSigninEvent';
import { extractSignupAnalytics } from '@packages/metrics/mixpanel/utilsSignup';
import { InvalidStateError } from '@packages/nextjs/errors';
import type { LoggedInUser } from '@packages/profile/getUser';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

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

    await trackOpSpaceSuccessfulSigninEvent({
      userId: user.id,
      identityType: 'Discord'
    });
    return res.status(200).json(user);
  } catch (error) {
    log.warn('Error while logging to Discord', error);

    throw new InvalidStateError('Failed to verify discord login');
  }
}

export default withSessionRoute(handler);
