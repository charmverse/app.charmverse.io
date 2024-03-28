import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { getPageMetaLite } from 'lib/pages/getPageMetaLite';
import type { PageMetaLite } from 'lib/pages/interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { isTruthy } from 'lib/utils/types';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getRecentPages);

async function getRecentPages(req: NextApiRequest, res: NextApiResponse<PageMetaLite[]>) {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
  const spaceId = req.query.spaceId;
  if (typeof spaceId !== 'string') {
    throw new Error('Missing spaceId');
  }

  const recentPageViews = await prisma.userSpaceAction.findMany({
    where: { action: 'view_page', createdBy: req.session?.user?.id, spaceId },
    distinct: ['pageId'],
    orderBy: {
      createdAt: 'desc'
    },
    take: limit,
    include: {
      page: {
        select: {
          id: true,
          title: true,
          hasContent: true,
          type: true,
          icon: true,
          path: true
        }
      }
    }
  });
  const result = recentPageViews.map((view) => view.page && getPageMetaLite(view.page)).filter(isTruthy);
  res.json(result);
}

export default withSessionRoute(handler);
