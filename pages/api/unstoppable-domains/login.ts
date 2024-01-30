import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { UnstoppableDomainsLoginRequest } from 'lib/blockchain/unstoppableDomains/loginWithUnstoppableDomain';
import { loginWithUnstoppableDomain } from 'lib/blockchain/unstoppableDomains/loginWithUnstoppableDomain';
import { extractSignupAnalytics } from 'lib/metrics/mixpanel/utilsSignup';
import type { SignupCookieType } from 'lib/metrics/userAcquisition/interfaces';
import { onError, onNoMatch } from 'lib/middleware';
import { saveSession } from 'lib/middleware/saveSession';
import { withSessionRoute } from 'lib/session/withSession';
import type { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(loginViaUnstoppableDomains);

async function loginViaUnstoppableDomains(
  req: NextApiRequest,
  res: NextApiResponse<LoggedInUser | { otpRequired: true }>
) {
  const { authSig } = req.body as UnstoppableDomainsLoginRequest;
  const cookiesToParse = req.cookies as Record<SignupCookieType, string>;
  const signupAnalytics = extractSignupAnalytics(cookiesToParse);

  const loggedInUser = await loginWithUnstoppableDomain({
    authSig,
    signupAnalytics
  });

  if (loggedInUser.otp?.activatedAt) {
    req.session.otpUser = { id: loggedInUser.id, method: 'UnstoppableDomain' };
    await req.session.save();

    return res.status(200).json({ otpRequired: true });
  }

  await saveSession({ req, userId: loggedInUser.id });

  res.status(200).json(loggedInUser);
}

export default withSessionRoute(handler);
