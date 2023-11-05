import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { evaluateTokenGateEligibility } from 'lib/tokenGates/evaluateEligibility';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(verifyWallet);

async function verifyWallet(req: NextApiRequest, res: NextApiResponse) {
  const user = req.session.user;

  const result = await evaluateTokenGateEligibility({
    ...req.body,
    userId: user.id
  });

  res.status(200).send(result);
}

export default withSessionRoute(handler);
