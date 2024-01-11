import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { updateSpaceCredentialEvents } from 'lib/credentials/templates';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'spaceId' }))
  .put(updateSpaceCredentialEventsController);

async function updateSpaceCredentialEventsController(req: NextApiRequest, res: NextApiResponse) {
  const credentials = await updateSpaceCredentialEvents(req.body);
  return res.status(200).json(credentials);
}

export default withSessionRoute(handler);
