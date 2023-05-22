import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { removeOldCookieFromResponse } from 'pages/api/session/removeOldCookie';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(logout);

async function logout(req: NextApiRequest, res: NextApiResponse<{ ok: boolean }>) {
  req.session.destroy();
  await removeOldCookieFromResponse(req, res, false);

  res.send({ ok: true });
}

export default withSessionRoute(handler);
