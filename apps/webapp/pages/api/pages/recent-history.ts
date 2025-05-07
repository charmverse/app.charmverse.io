import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import type { PageViewMeta } from 'lib/pages/getRecentHistory';
import { getRecentHistory } from 'lib/pages/getRecentHistory';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getRecentPages);

async function getRecentPages(req: NextApiRequest, res: NextApiResponse<PageViewMeta[]>) {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  const spaceId = req.query.spaceId;
  if (typeof spaceId !== 'string') {
    throw new Error('Missing spaceId');
  }

  const history = await getRecentHistory({ userId: req.session?.user?.id, spaceId, limit });

  res.json(history);
}

export default withSessionRoute(handler);
