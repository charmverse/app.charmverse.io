import { log } from '@charmverse/core/log';
import { extractSignupAnalytics } from '@packages/metrics/mixpanel/utilsSignup';
import type { SignupCookieType } from '@packages/metrics/userAcquisition/interfaces';
import type { LoggedInUser } from '@packages/profile/getUser';
import { postUserCreate } from '@packages/users/postUserCreate';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { LoginWithGoogleRequest } from 'lib/google/loginWithGoogle';
import { loginWithMagicLink } from 'lib/google/loginWithMagicLink';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(verifyMagicLink);

async function verifyMagicLink(req: NextApiRequest, res: NextApiResponse<LoggedInUser | { otpRequired: true }>) {
  const toVerify: LoginWithGoogleRequest = req.body;

  const { user, isNew } = await loginWithMagicLink({ magicLink: toVerify });

  if (isNew) {
    const cookiesToParse = req.cookies as Record<SignupCookieType, string>;
    const signupAnalytics = extractSignupAnalytics(cookiesToParse);
    postUserCreate({ user, identityType: 'VerifiedEmail', signupAnalytics });
  }

  if (user.otp?.activatedAt) {
    req.session.otpUser = { id: user.id, method: 'VerifiedEmail' };
    await req.session.save();

    return res.status(200).json({ otpRequired: true });
  }

  log.info(`User ${user.id} logged in with Magic Link`, { userId: user.id, method: 'magic_link' });

  req.session.user = { id: user.id };

  await req.session.save();
  return res.status(200).json(user);
}

export default withSessionRoute(handler);
