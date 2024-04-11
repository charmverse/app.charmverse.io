import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getPersonaSession)
  .post(init);

async function getPersonaSession(req: NextApiRequest, res: NextApiResponse<any | null>) {
  const spaceId = req.query.id as string;
  const userId = req.session.user.id as string;

  // const data = await getSynapsSessionDetails(spaceId, userId);

  res.status(200).json({});
}

async function init(req: NextApiRequest, res: NextApiResponse<any>) {
  const spaceId = req.query.id as string;
  const userId = req.session.user.id as string;

  res.status(200).json({});
}

export default withSessionRoute(handler);
