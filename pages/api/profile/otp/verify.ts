import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { verifyOtpToken } from 'lib/profile/otp/verifyOtpToken';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['code'], 'body'))
  .put(verifyOTP);

async function verifyOTP(req: NextApiRequest, res: NextApiResponse<void>) {
  const userId = req.session.user.id;
  const confirmationCode = String(req.body.code);

  await verifyOtpToken(userId, confirmationCode);

  return res.status(200).end();
}

export default withSessionRoute(handler);
