import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { isProfilePathAvailable } from 'lib/profile/isProfilePathAvailable';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(checkPathExists);

export async function checkPathExists (req: NextApiRequest, res: NextApiResponse<{ available: boolean }>) {
  const path = req.query.path as string;
  const isAvailable = await isProfilePathAvailable(path, req.session.user.id);

  res.status(200).json({ available: isAvailable });
}

export default withSessionRoute(handler);
