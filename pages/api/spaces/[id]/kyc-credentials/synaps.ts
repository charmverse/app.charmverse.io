import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { createSynapsSession } from 'lib/kyc/synaps/createSynapsSession';
import { getSynapsSessionDetails } from 'lib/kyc/synaps/getSynapsSessionDetails';
import type { SynapsSession, SynapsSessionDetails } from 'lib/kyc/synaps/interfaces';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getSynapsSession)
  .post(init);

async function getSynapsSession(req: NextApiRequest, res: NextApiResponse<SynapsSessionDetails | null>) {
  const spaceId = req.query.id as string;
  const userId = req.session.user.id as string;

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
