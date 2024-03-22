import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { indexProposalCredentials } from 'lib/credentials/indexOnChainProposalCredential';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { sleep } from 'lib/utils/sleep';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(getIssuableProposalCredentialsController);

async function getIssuableProposalCredentialsController(req: NextApiRequest, res: NextApiResponse) {
  await sleep(3000);
  throw new Error('Error issuing credentials');
  const issuableCredentials = await indexProposalCredentials(req.body);
  return res.status(200).json(issuableCredentials);
}

export default withSessionRoute(handler);
