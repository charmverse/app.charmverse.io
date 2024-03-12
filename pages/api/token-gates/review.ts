import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { updateTokenGateDetails } from 'lib/blockchain/updateTokenGateDetails';
import { onError, onNoMatch } from 'lib/middleware';
import requireValidation from 'lib/middleware/requireValidation';
import { withSessionRoute } from 'lib/session/withSession';
import type { TokenGate } from 'lib/tokenGates/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireValidation('tokenGateConditions')).post(reviewTokenGate);

async function reviewTokenGate(req: NextApiRequest, res: NextApiResponse<TokenGate>) {
  const body = req.body as TokenGate;
  const updatedResult = await updateTokenGateDetails([body]);

  res.status(200).json(updatedResult[0]);
}

export default withSessionRoute(handler);
