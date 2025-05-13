import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getFarcasterUsers, type FarcasterUser } from '@packages/lib/farcaster/getFarcasterUsers';
import { onError, onNoMatch } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(searchFarcasterUserByUsernameHandler);

async function searchFarcasterUserByUsernameHandler(req: NextApiRequest, res: NextApiResponse<FarcasterUser[]>) {
  const username = req.query.username as string;

  const farcasterUsers = await getFarcasterUsers({
    username
  });

  return res.status(200).json(farcasterUsers);
}

export default withSessionRoute(handler);
