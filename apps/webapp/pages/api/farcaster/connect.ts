import { log } from '@charmverse/core/log';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import type { LoggedInUser } from '@packages/profile/getUser';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { connectFarcaster } from '@packages/lib/farcaster/connectFarcaster';
import { disconnectFarcaster } from '@packages/lib/farcaster/disconnectFarcaster';
import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .post(requireKeys(['fid', 'username'], 'body'), connectWarpcastHandler)
  .delete(disconnectWarpcastHandler);

async function connectWarpcastHandler(req: NextApiRequest, res: NextApiResponse<LoggedInUser>) {
  const body = req.body as FarcasterBody;
  const userId = req.session.user.id;

  const user = await connectFarcaster({
    ...body,
    userId
  });

  log.info(`User ${user.id} added Farcaster to his account`, { userId: user.id, method: 'farcaster' });

  return res.status(200).json(user);
}

async function disconnectWarpcastHandler(req: NextApiRequest, res: NextApiResponse<LoggedInUser>) {
  const userId = req.session.user.id;

  const user = await disconnectFarcaster({ userId });

  log.info(`User ${user.id} removed Farcaster from his account`, { userId: user.id, method: 'farcaster' });

  return res.status(200).json(user);
}

export default withSessionRoute(handler);
