import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireKeys } from 'lib/middleware/requireKeys';
import { withSessionRoute } from 'lib/session/withSession';
import { verifyMembership } from 'lib/summon/verifyMembership';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys([{ key: 'spaceId', truthy: true }], 'query'))
  .get(checkDiscordGateEndpoint);

async function checkDiscordGateEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.spaceId as string;
  const userId = req.session?.user?.id;

  const result = await verifyMembership({ spaceId, userId });

  return res.status(201).json(result);
}

export default withSessionRoute(handler);
