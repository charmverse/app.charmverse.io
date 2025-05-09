import { indexOnchainProposalCredentials } from '@packages/credentials/indexOnChainProposalCredential';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(requestProposalCredentialsIndexingController);

async function requestProposalCredentialsIndexingController(req: NextApiRequest, res: NextApiResponse) {
  await indexOnchainProposalCredentials(req.body);
  return res.status(200).json({ success: true });
}

export default withSessionRoute(handler);
