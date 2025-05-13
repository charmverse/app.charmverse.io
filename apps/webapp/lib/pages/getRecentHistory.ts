import { prisma } from '@charmverse/core/prisma-client';
import { isTruthy } from '@packages/utils/types';

import { getPageMetaLite } from './getPageMetaLite';
import type { PageMetaLite } from './interfaces';

export type PageViewMeta = PageMetaLite & {
  lastViewedAt: string;
};

export async function getRecentHistory({
  userId,
  spaceId,
  limit = 100
}: {
  userId: string;
  spaceId: string;
  limit?: number;
}): Promise<PageViewMeta[]> {
  const recentPageViews = await prisma.userSpaceAction.findMany({
    where: { action: 'view_page', createdBy: userId, spaceId },
    distinct: ['pageId'],
    orderBy: {
      createdAt: 'desc'
    },
    take: limit,
    include: {
      page: {
        select: {
          id: true,
          parentId: true,
          title: true,
          hasContent: true,
          type: true,
          icon: true,
          path: true
        }
      }
    }
  });
  return recentPageViews
    .map((view) => {
      if (!view.page) return null;
      const meta = getPageMetaLite(view.page);
      return {
        ...meta,
        lastViewedAt: view.createdAt.toISOString()
      };
    })
    .filter(isTruthy);
}
