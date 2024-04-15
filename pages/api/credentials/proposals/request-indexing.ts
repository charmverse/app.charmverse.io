import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { indexOnchainProposalCredentials } from 'lib/credentials/indexOnChainProposalCredential';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(requestProposalCredentialsIndexingController);

async function requestProposalCredentialsIndexingController(req: NextApiRequest, res: NextApiResponse) {
  await indexOnchainProposalCredentials(req.body);
  return res.status(200).json({ success: true });
}

export default withSessionRoute(handler);
