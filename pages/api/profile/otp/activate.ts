import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { OtpResponse } from 'lib/profile/otp/createUserOtp';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(activateOtp);

async function activateOtp(req: NextApiRequest, res: NextApiResponse<OtpResponse>) {
  const userId = req.session.user.id;

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      userOTP: {
        select: {
          activatedAt: true
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

  if (user.userOTP?.activatedAt) {
    throw new InvalidInputError('OTP already activated');
  }

  await prisma.userOTP.update({
    where: {
      userId
    },
    data: {
      activatedAt: new Date()
    }
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
