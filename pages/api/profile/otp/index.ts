import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import type { CreateOtpResponse } from '@packages/profile/otp/createUserOtp';
import { createUserOtp } from '@packages/profile/otp/createUserOtp';
import { deleteUserOtp } from '@packages/profile/otp/deleteUserOtp';
import type { GetOtpResponse } from '@packages/profile/otp/getUserOtp';
import { getUserOtp } from '@packages/profile/otp/getUserOtp';
import { verifyOtpToken } from '@packages/profile/otp/verifyOtpToken';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .post(createOtp)
  .use(requireUser)
  .use(requireKeys(['authCode'], 'query'))
  .delete(deleteOtp)
  .use(requireUser)
  .use(requireKeys(['authCode'], 'query'))
  .get(getOtp);

async function createOtp(req: NextApiRequest, res: NextApiResponse<CreateOtpResponse>) {
  const userId = req.session.user.id;

  const code = await createUserOtp(userId);

  res.status(200).json(code);
}

async function getOtp(req: NextApiRequest, res: NextApiResponse<GetOtpResponse>) {
  const userId = req.session.user.id;
  const authCode = String(req.query.authCode);

  await verifyOtpToken(userId, authCode);

  const code = await getUserOtp(userId);

  res.status(200).json(code);
}

async function deleteOtp(req: NextApiRequest, res: NextApiResponse<void>) {
  const userId = req.session.user.id;
  const authCode = String(req.query.authCode);

  await verifyOtpToken(userId, authCode);

  await deleteUserOtp(userId);

  trackUserAction('delete_otp', { userId });

  res.status(200).end();
}

export default withSessionRoute(handler);
