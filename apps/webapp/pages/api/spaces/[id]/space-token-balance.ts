import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getSpaceTokenBalance } from 'lib/spaces/getSpaceTokenBalance';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getSpaceTokenBalanceController);

async function getSpaceTokenBalanceController(req: NextApiRequest, res: NextApiResponse<number>) {
  const { id: spaceId } = req.query as { id: string };

  const spaceTokenBalance = await getSpaceTokenBalance({ spaceId });

  res.status(200).json(spaceTokenBalance);
}

export default withSessionRoute(handler);
