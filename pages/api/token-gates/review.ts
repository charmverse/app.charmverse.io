import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { updateTokenGateLitDetails } from 'lib/blockchain/updateTokenGateDetails';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { LitTokenGateConditions } from 'lib/tokenGates/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(reviewTokenGate);

async function reviewTokenGate(req: NextApiRequest, res: NextApiResponse) {
  const body = req.body as { conditions: LitTokenGateConditions };

  const updatedResult = await updateTokenGateLitDetails([body]);

  res.status(200).json(updatedResult);
}

export default withSessionRoute(handler);
