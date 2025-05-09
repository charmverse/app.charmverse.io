import { getReferralCode } from '@packages/users/getReferralCode';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getReferralCodeHandler);

async function getReferralCodeHandler(req: NextApiRequest, res: NextApiResponse<{ code: string | null }>) {
  const userId = req.session.user.id;
  const shouldGenerate = !!req.query.request;

  const code = await getReferralCode(userId, shouldGenerate);

  res.status(200).json({ code });
}

export default withSessionRoute(handler);
