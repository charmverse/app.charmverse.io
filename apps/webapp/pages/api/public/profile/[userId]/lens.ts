import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { fetchLensProfile } from '@packages/lib/lens/fetchLensProfile';
import { onError, onNoMatch } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getLensProfile);

async function getLensProfile(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.query.userId as string;

  const lensProfile = await fetchLensProfile(userId);

  return res.status(200).send(lensProfile);
}

export default withSessionRoute(handler);
