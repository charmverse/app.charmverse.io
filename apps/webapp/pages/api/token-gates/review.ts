import { updateTokenGateDetails } from '@packages/lib/blockchain/updateTokenGateDetails';
import { onError, onNoMatch } from '@packages/lib/middleware';
import requireValidation from '@packages/lib/middleware/requireValidation';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { TokenGate } from '@packages/lib/tokenGates/interfaces';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireValidation('tokenGateConditions')).post(reviewTokenGate);

async function reviewTokenGate(req: NextApiRequest, res: NextApiResponse<TokenGate>) {
  const body = req.body as TokenGate;
  const updatedResult = await updateTokenGateDetails([body]);

  res.status(200).json(updatedResult[0]);
}

export default withSessionRoute(handler);
