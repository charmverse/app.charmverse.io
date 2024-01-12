import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { OtpResponse } from 'lib/profile/otp/createUserOtp';
import { createUserOtp } from 'lib/profile/otp/createUserOtp';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createOtp);

async function createOtp(req: NextApiRequest, res: NextApiResponse<OtpResponse>) {
  const userId = req.session.user.id;

  const code = await createUserOtp(userId);

  res.status(200).json(code);
}

export default withSessionRoute(handler);
