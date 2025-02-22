import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { IdentityType } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import type { LoggedInUser } from '@packages/profile/getUser';
import { getUserProfile } from '@packages/profile/getUser';
import { verifyOtpToken } from '@packages/profile/otp/verifyOtpToken';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys(['authCode'], 'body')).post(verifyOtp);

async function verifyOtp(req: NextApiRequest, res: NextApiResponse<LoggedInUser>) {
  const otpUser = req.session.otpUser as { id: string; method: IdentityType } | undefined;

  if (!otpUser?.id) {
    throw new InvalidInputError(
      'No OTP user found. Please go to login page and start again the process of authentication.'
    );
  }
  const userId = otpUser.id;
  const method = otpUser.method;
  const authCode = String(req.body.authCode);

  await verifyOtpToken(userId, authCode);

  req.session.anonymousUserId = undefined;
  req.session.otpUser = undefined;
  req.session.user = { id: userId };
  await req.session.save();

  const user = await getUserProfile('id', userId);

  trackUserAction('sign_in_otp', { userId: user.id, identityType: method });

  log.info(`User ${user.id} verified otp and logged in  with ${method}`, { userId: user.id, method });

  res.status(200).json(user);
}

export default withSessionRoute(handler);
