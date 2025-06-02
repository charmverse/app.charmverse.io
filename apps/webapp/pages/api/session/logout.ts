import { log } from '@charmverse/core/log';
import { onError, onNoMatch } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(logout);

async function logout(req: NextApiRequest, res: NextApiResponse<{ ok: boolean }>) {
  log.debug('User logged out', { userId: req.session.user?.id });

  req.session.destroy();

  res.send({ ok: true });
}

export default withSessionRoute(handler);
