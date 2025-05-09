import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getBuildId);

async function getBuildId(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({ buildId: process.env.REACT_APP_BUILD_ID });
}

export default withSessionRoute(handler);
