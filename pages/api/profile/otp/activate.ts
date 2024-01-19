import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { verifyOtpToken } from 'lib/profile/otp/verifyOtpToken';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['authCode'], 'body'))
  .put(activateOtp);

async function activateOtp(req: NextApiRequest, res: NextApiResponse<void>) {
  const userId = req.session.user.id;
  const authCode = String(req.body.authCode);

  await verifyOtpToken(userId, authCode);

  await prisma.otp.update({
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
