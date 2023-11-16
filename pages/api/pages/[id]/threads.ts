import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { NotFoundError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getPageThreads } from 'lib/threads/getPageThreads';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    providePermissionClients({
      key: 'id',
      location: 'query',
      resourceIdType: 'page'
    })
  )
  .get(getThreads);

async function getThreads(req: NextApiRequest, res: NextApiResponse) {
  const pageId = req.query.id as string;
  const userId = req.session?.user?.id;
  const computed = await req.basePermissionsClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (computed.comment !== true) {
    throw new NotFoundError('Page not found');
  }

  const threads = await getPageThreads({ pageId, userId });

  return res.status(200).json(threads);
}

export default withSessionRoute(handler);
