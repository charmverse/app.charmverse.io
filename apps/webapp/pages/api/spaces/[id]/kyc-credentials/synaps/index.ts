import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { createSynapsSession } from '@packages/lib/kyc/synaps/createSynapsSession';
import { getSynapsSessionDetails } from '@packages/lib/kyc/synaps/getSynapsSessionDetails';
import type { SynapsSession, SynapsSessionDetails } from '@packages/lib/kyc/synaps/interfaces';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser, requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getSynapsSession)
  .post(init);

async function getSynapsSession(req: NextApiRequest, res: NextApiResponse<SynapsSessionDetails | null>) {
  const spaceId = req.query.id as string;
  const userId = req.session.user.id;

  const data = await getSynapsSessionDetails(spaceId, userId);

  res.status(200).json(data);
}

async function init(req: NextApiRequest, res: NextApiResponse<SynapsSession>) {
  const spaceId = req.query.id as string;
  const userId = req.session.user.id as string;

  const data = await createSynapsSession(spaceId, userId);

  res.status(200).json(data);
}

export default withSessionRoute(handler);
