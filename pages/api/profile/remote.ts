import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { isDevEnv } from 'config/constants';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

if (isDevEnv) {
  handler.get(register);
}

async function register(req: NextApiRequest, res: NextApiResponse) {
  const userId = (req.query.id || req.query.userId) as string | undefined;
  if (!userId) {
    throw new Error('Please provider ?userid=...');
  }
  req.session.user = { id: userId };

  await req.session.save();

  res.redirect('/');
}

export default withSessionRoute(handler);
