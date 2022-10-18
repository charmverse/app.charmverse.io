
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { logWorkspaceJoinedViaTokenGate } from 'lib/metrics/postToDiscord';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { applyTokenGates } from 'lib/token-gates/applyTokenGates';
import type { TokenGateVerification } from 'lib/token-gates/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(verifyWallet);

async function verifyWallet (req: NextApiRequest, res: NextApiResponse) {

  const tokenGateVerification: TokenGateVerification = {
    ...req.body,
    userId: req.session.user.id
  };

  const result = await applyTokenGates(tokenGateVerification);

  logWorkspaceJoinedViaTokenGate(result.space.id);

  res.status(200).send(result);

}

export default withSessionRoute(handler);
