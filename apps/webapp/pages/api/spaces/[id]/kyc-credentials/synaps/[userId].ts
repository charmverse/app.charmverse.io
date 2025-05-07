import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getSynapsSessionDetails } from '@packages/lib/kyc/synaps/getSynapsSessionDetails';
import type { SynapsSessionDetails } from '@packages/lib/kyc/synaps/interfaces';
import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['userId'], 'query'))
  .get(getSynapsSession);

async function getSynapsSession(req: NextApiRequest, res: NextApiResponse<SynapsSessionDetails | null>) {
  const spaceId = req.query.id as string;
  const userId = req.query.userId as string;

  const data = await getSynapsSessionDetails(spaceId, userId);

  res.status(200).json(data);
}

export default withSessionRoute(handler);
