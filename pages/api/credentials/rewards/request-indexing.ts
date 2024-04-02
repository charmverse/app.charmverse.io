import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { indexRewardCredentials } from 'lib/credentials/indexOnChainRewardCredential';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(requestRewardCredentialsIndexingController);

async function requestRewardCredentialsIndexingController(req: NextApiRequest, res: NextApiResponse) {
  const issuableCredentials = await indexRewardCredentials(req.body);
  return res.status(200).json(issuableCredentials);
}

export default withSessionRoute(handler);
