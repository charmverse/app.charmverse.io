import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { findSpaceIssuableRewardCredentials } from 'lib/credentials/findIssuableRewardCredentials';
import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(
    requireKeys(['spaceId'], 'query'),
    requireSpaceMembership({ adminOnly: false }),
    getIssuableRewardCredentialsController
  );

async function getIssuableRewardCredentialsController(req: NextApiRequest, res: NextApiResponse) {
  const issuableCredentials = await findSpaceIssuableRewardCredentials({ spaceId: req.query.spaceId as string });
  return res.status(200).json(issuableCredentials);
}

export default withSessionRoute(handler);
