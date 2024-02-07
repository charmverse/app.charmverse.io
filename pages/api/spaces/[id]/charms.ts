import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { CharmsBalance } from 'lib/charms/getUserOrSpaceBalance';
import { getUserOrSpaceBalance } from 'lib/charms/getUserOrSpaceBalance';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' })).get(getCharmsHandler);

async function getCharmsHandler(req: NextApiRequest, res: NextApiResponse<CharmsBalance | null>) {
  const spaceId = req.query.id as string;

  const balance = await getUserOrSpaceBalance({ spaceId, readOnly: true });

  res.status(200).json(balance);
}

export default withSessionRoute(handler);
