import { log } from '@charmverse/core/log';
import type { IdentityType } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { requireOtpUser } from 'lib/middleware/requireOtpUser';
import { verifyOtpToken } from 'lib/profile/otp/verifyOtpToken';
import { withSessionRoute } from 'lib/session/withSession';
import { getUserProfile } from 'lib/users/getUser';
import type { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireOtpUser)
  .use(requireKeys(['authCode'], 'body'))
  .post(verifyOtp);

async function verifyOtp(req: NextApiRequest, res: NextApiResponse<LoggedInUser>) {
  const otpUser = req.session.otpUser as { id: string; method: IdentityType };
  const userId = otpUser.id;
  const method = otpUser.method;
  const authCode = String(req.body.authCode);

  await verifyOtpToken(userId, authCode);

  req.session.otpUser = undefined;
  req.session.user = { id: userId };
  await req.session.save();

  const user = await getUserProfile('id', userId);

  trackUserAction('sign_in', { userId: user.id, identityType: method });

  log.info(`User ${user.id} logged in with Wallet`, { userId: user.id, method });

  res.status(200).json(user);
}

export default withSessionRoute(handler);
