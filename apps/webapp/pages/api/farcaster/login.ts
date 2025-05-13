import { log } from '@charmverse/core/log';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import type { LoginWithFarcasterParams } from '@packages/connect-shared/lib/session/loginWithFarcaster';
import { loginWithFarcaster } from '@packages/connect-shared/lib/session/loginWithFarcaster';
import { trackOpSpaceSuccessfulSigninEvent } from '@packages/metrics/mixpanel/trackOpSpaceSigninEvent';
import { extractSignupAnalytics } from '@packages/metrics/mixpanel/utilsSignup';
import type { LoggedInUser } from '@packages/profile/getUser';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys(['fid', 'username'], 'body')).post(loginWarpcastHandler);

async function loginWarpcastHandler(req: NextApiRequest, res: NextApiResponse<LoggedInUser | { otpRequired: true }>) {
  const body = req.body as FarcasterBody;

  const signupAnalytics = extractSignupAnalytics(req.cookies as any);

  const user = await loginWithFarcaster({
    ...body,
    signupAnalytics
  } as LoginWithFarcasterParams);

  req.session.anonymousUserId = undefined;

  if (user.otp?.activatedAt) {
    req.session.otpUser = { id: user.id, method: 'Farcaster' };
    await req.session.save();

    return res.status(200).json({ otpRequired: true });
  }

  req.session.user = { id: user.id };
  await req.session.save();

  log.info(`User ${user.id} logged in with Farcaster`, { userId: user.id, method: 'farcaster' });

  await trackOpSpaceSuccessfulSigninEvent({
    userId: user.id,
    identityType: 'Farcaster'
  });
  return res.status(200).json(user);
}

export default withSessionRoute(handler);
