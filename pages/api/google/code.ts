import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { loginWithGoogleCode } from 'lib/google/loginWithGoogleCode';
import { extractSignupAnalytics } from 'lib/metrics/mixpanel/utilsSignup';
import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { saveSession } from 'lib/middleware/saveSession';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys(['code'], 'body')).post(loginWithGoogleCodeHandler);

async function loginWithGoogleCodeHandler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.body as { code: string };
  const signupAnalytics = extractSignupAnalytics(req.cookies as any);

  const loggedInUser = await loginWithGoogleCode({
    code,
    signupAnalytics
  });

  await saveSession({ req, userId: loggedInUser.id });

  res.status(200).send(loggedInUser);
}

export default withSessionRoute(handler);
