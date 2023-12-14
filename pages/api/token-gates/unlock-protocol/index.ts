import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { Lock } from 'lib/tokenGates/interfaces';
import { getLockDetails } from 'lib/tokenGates/unlock/getLockDetails';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(lockDetails);

async function lockDetails(req: NextApiRequest, res: NextApiResponse<Lock>) {
  const contract = req.query.contract as string;
  const chainId = req.query.chainId as string;
  const walletAddress = req.query.walletAddress as string;

  const result = await getLockDetails({ contract, chainId: Number(chainId), walletAddress }, true);

  res.status(200).json(result);
}

export default withSessionRoute(handler);
