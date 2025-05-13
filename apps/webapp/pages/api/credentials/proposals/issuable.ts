import type { FindIssuableProposalCredentialsInput } from '@packages/credentials/findIssuableProposalCredentials';
import { findSpaceIssuableProposalCredentials } from '@packages/credentials/findIssuableProposalCredentials';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(
    requireKeys(['spaceId'], 'query'),
    requireSpaceMembership({ adminOnly: false }),
    getIssuableProposalCredentialsController
  );

async function getIssuableProposalCredentialsController(req: NextApiRequest, res: NextApiResponse) {
  const issuableCredentials = await findSpaceIssuableProposalCredentials(
    req.query as FindIssuableProposalCredentialsInput
  );
  return res.status(200).json(issuableCredentials);
}

export default withSessionRoute(handler);
