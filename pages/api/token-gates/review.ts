import { InvalidInputError } from '@charmverse/core/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { updateTokenGateLitDetails } from 'lib/blockchain/updateLitDetails';
import { updateTokenGateLockDetails } from 'lib/blockchain/updateLocksDetails';
import { onError, onNoMatch } from 'lib/middleware';
import requireValidation from 'lib/middleware/requireValidation';
import { withSessionRoute } from 'lib/session/withSession';
import type { TokenGateConditions } from 'lib/tokenGates/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireValidation('tokenGateConditions')).post(reviewTokenGate);

async function reviewTokenGate(req: NextApiRequest, res: NextApiResponse) {
  const body = req.body as TokenGateConditions;
  let updatedResult: TokenGateConditions[] | undefined;

  if (body.type === 'lit') {
    updatedResult = await updateTokenGateLitDetails([body]);
  } else if (body.type === 'unlock') {
    updatedResult = await updateTokenGateLockDetails([body]);
  } else {
    throw new InvalidInputError('Invalid token gate type');
  }

  res.status(200).json(updatedResult);
}

export default withSessionRoute(handler);
