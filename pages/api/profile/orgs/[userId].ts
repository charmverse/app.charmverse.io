import { getUserSpaces } from '@packages/profile/getUserSpaces';
import type { UserCommunity } from '@packages/profile/interfaces';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getUserOrgs);

async function getUserOrgs(req: NextApiRequest, res: NextApiResponse<UserCommunity[]>) {
  const { userId } = req.query as { userId: string };

  const communities = await getUserSpaces({ userId });

  return res.status(200).json(communities);
}

export default withSessionRoute(handler);
