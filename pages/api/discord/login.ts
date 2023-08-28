import { log } from '@charmverse/core/log';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { loginByDiscord } from 'lib/discord/loginByDiscord';
import { updateGuildRolesForUser } from 'lib/guild-xyz/server/updateGuildRolesForUser';
import { extractSignupAnalytics } from 'lib/metrics/mixpanel/utilsSignup';
import { InvalidStateError, onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(loginDiscordCodeHandler);

async function loginDiscordCodeHandler(req: NextApiRequest, res: NextApiResponse<LoggedInUser>) {
  const tempAuthCode = req.body.code as string;

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

    log.info(`User ${user.id} logged in with Discord`, { userId: user.id, method: 'discord' });

    await req.session.save();

    return res.status(200).json(user);
  } catch (error) {
    log.warn('Error while logging to Discord', error);

    throw new InvalidStateError('Failed to verify discord login');
  }
}

export default withSessionRoute(handler);
