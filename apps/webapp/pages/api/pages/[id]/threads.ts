import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { getPageThreads } from '@packages/lib/threads/getPageThreads';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getThreads);

async function getThreads(req: NextApiRequest, res: NextApiResponse) {
  const pageId = req.query.id as string;
  const userId = req.session?.user?.id;
  const computed = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (computed.comment !== true) {
    return res.status(200).json([]);
  }

  const threads = await getPageThreads({ pageId, userId });

  return res.status(200).json(threads);
}

export default withSessionRoute(handler);
