import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import type { CreateOtpResponse } from 'lib/profile/otp/createUserOtp';
import { createUserOtp } from 'lib/profile/otp/createUserOtp';
import { verifyOtpToken } from 'lib/profile/otp/verifyOtpToken';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['authCode'], 'body'))
  .put(updateRecoveryCodeOtp);

async function updateRecoveryCodeOtp(req: NextApiRequest, res: NextApiResponse<CreateOtpResponse>) {
  const userId = req.session.user.id;
  const authCode = String(req.body.authCode);

  await verifyOtpToken(userId, authCode);

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      userOTP: {
        include: {
          recoveryCode: true
        }
      }
    }
  });

  if (!user) {
    throw new InvalidInputError('User not found');
  }

  if (!user.userOTP) {
    throw new InvalidInputError('OTP not found');
  }

  if (!user.userOTP.recoveryCode) {
    throw new InvalidInputError('User does not have a recovery code');
  }

  const otp = await createUserOtp(userId);

  return res.status(200).json(otp);
}

export default withSessionRoute(handler);
