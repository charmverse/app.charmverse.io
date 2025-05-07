import { log } from '@charmverse/core/log';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from '@packages/lib/middleware';
import { removeOldCookieFromResponse } from '@packages/lib/session/removeOldCookie';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(logout);

async function logout(req: NextApiRequest, res: NextApiResponse<{ ok: boolean }>) {
  log.debug('User logged out', { userId: req.session.user?.id });

  req.session.destroy();
  await removeOldCookieFromResponse(req, res, false);

  res.send({ ok: true });
}

export default withSessionRoute(handler);
