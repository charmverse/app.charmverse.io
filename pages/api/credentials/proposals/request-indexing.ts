import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { findSpaceIssuableProposalCredentials } from 'lib/credentials/findIssuableProposalCredentials';
import { getAllUserCredentials } from 'lib/credentials/getAllUserCredentials';
import { bulkIndexProposalCredentials } from 'lib/credentials/indexOnChainProposalCredential';
import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(requireSpaceMembership({ adminOnly: false }), getIssuableProposalCredentialsController);

async function getIssuableProposalCredentialsController(req: NextApiRequest, res: NextApiResponse) {
  const issuableCredentials = await bulkIndexProposalCredentials(req.body);
  return res.status(200).json(issuableCredentials);
}

export default withSessionRoute(handler);
