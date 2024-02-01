import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { connectAccountWithGoogleCode } from 'lib/google/connectGoogleAccountWithCode';
import { loginWithGoogleCode } from 'lib/google/loginWithGoogleCode';
import { extractSignupAnalytics } from 'lib/metrics/mixpanel/utilsSignup';
import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { saveSession } from 'lib/middleware/saveSession';
import { withSessionRoute } from 'lib/session/withSession';
import type { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys(['code'], 'body')).post(connectAccountWithGoogleCodeHandler);

async function connectAccountWithGoogleCodeHandler(
  req: NextApiRequest,
  res: NextApiResponse<LoggedInUser | { otpRequired: true } | null>
) {
  const { code, type = 'login' } = req.body as { code: string; type: 'login' | 'connect' };

  let loggedInUser: LoggedInUser | null = null;

  if (type === 'login') {
    const signupAnalytics = extractSignupAnalytics(req.cookies as any);
    loggedInUser = await loginWithGoogleCode({
      code,
      signupAnalytics
    });

    if (loggedInUser.otp?.activatedAt) {
      req.session.otpUser = { id: loggedInUser.id, method: 'Google' };
      await req.session.save();

      return res.status(200).json({ otpRequired: true });
    }
  } else if (type === 'connect') {
    loggedInUser = await connectAccountWithGoogleCode({ code, userId: req.session.user.id });
  }

  if (loggedInUser) {
    await saveSession({ req, userId: loggedInUser.id });
  }

  res.status(200).send(loggedInUser);
}

export default withSessionRoute(handler);
