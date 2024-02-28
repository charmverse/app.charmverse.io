import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getReferralCode } from 'lib/users/getReferralCode';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getReferralCodeHandler);

async function getReferralCodeHandler(req: NextApiRequest, res: NextApiResponse<{ code: string | null }>) {
  const userId = req.session.user.id;
  const shouldGenerate = !!req.query.request;

  const code = await getReferralCode(userId, shouldGenerate);

  res.status(200).json({ code });
}

export default withSessionRoute(handler);
