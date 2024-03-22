import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { indexProposalCredentials } from 'lib/credentials/indexOnChainProposalCredential';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(requestProposalCredentialsIndexingController);

async function requestProposalCredentialsIndexingController(req: NextApiRequest, res: NextApiResponse) {
  const issuableCredentials = await indexProposalCredentials(req.body);
  return res.status(200).json(issuableCredentials);
}

export default withSessionRoute(handler);
