import type { IdentityType } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import { log } from '@packages/core/log';
import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import type { LoggedInUser } from '@packages/profile/getUser';
import { getUserProfile } from '@packages/profile/getUser';
import type { CreateOtpResponse } from '@packages/profile/otp/createUserOtp';
import { createUserOtp } from '@packages/profile/otp/createUserOtp';
import { verifyOtpToken } from '@packages/profile/otp/verifyOtpToken';
import { verifyRecoveryCode } from '@packages/profile/otp/verifyRecoveryCode';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .post(requireKeys(['backupCode'], 'body'), verifyBackupCode)
  .use(requireUser)
  .use(requireKeys(['authCode'], 'body'))
  .put(updateRecoveryCodeOtp);

async function updateRecoveryCodeOtp(req: NextApiRequest, res: NextApiResponse<CreateOtpResponse>) {
  const userId = req.session.user.id;
  const authCode = String(req.body.authCode);

  await verifyOtpToken(userId, authCode);

  const otp = await createUserOtp(userId);

  return res.status(200).json(otp);
}

async function verifyBackupCode(req: NextApiRequest, res: NextApiResponse<{ user: LoggedInUser; backupCode: string }>) {
  const otpUser = req.session.otpUser as { id: string; method: IdentityType } | undefined;

  if (!otpUser?.id) {
    throw new InvalidInputError(
      'No OTP user found. Please go to login page and start again the process of authentication.'
    );
  }
  const userId = otpUser.id;
  const method = otpUser.method;
  const backupCode = String(req.body.backupCode);

  await verifyRecoveryCode(userId, backupCode);

  const otp = await createUserOtp(userId);

  req.session.anonymousUserId = undefined;
  req.session.otpUser = undefined;
  req.session.user = { id: userId };
  await req.session.save();

  const user = await getUserProfile('id', userId);

  trackUserAction('sign_in_recovery_code', { userId: user.id, identityType: method });

  log.info(`User ${user.id} verified his recovery code and logged in  with ${method}`, { userId: user.id, method });

  res.status(200).json({ user, backupCode: otp.recoveryCode });
}

export default withSessionRoute(handler);
