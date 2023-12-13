import { log } from '@charmverse/core/log';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { removeOldCookieFromResponse } from 'lib/session/removeOldCookie';
import { withSessionRoute } from 'lib/session/withSession';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(logout);

async function logout(req: NextApiRequest, res: NextApiResponse<{ ok: boolean }>) {
  const userId = req.session.user?.id;
  log.debug('User logged out', { userId });

  req.session.destroy();
  await removeOldCookieFromResponse(req, res, false);

  relay.broadcastToAll({
    type: 'logout',
    payload: {
      userId
    }
  });

  res.send({ ok: true });
}

export default withSessionRoute(handler);
