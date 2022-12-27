import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { disconnectDiscordAccount } from 'lib/discord/disconnectDiscordAccount';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireUser).post(disconnectDiscord);

async function disconnectDiscord(req: NextApiRequest, res: NextApiResponse) {
  const updatedUser = await disconnectDiscordAccount({ userId: req.session.user.id });

  return res.status(200).json(updatedUser);
}

export default withSessionRoute(handler);
