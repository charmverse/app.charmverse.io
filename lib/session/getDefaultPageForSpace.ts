import type { PageMeta } from '@charmverse/core/pages';
import { pageTree } from '@charmverse/core/pages/utilities';
import { prisma } from '@charmverse/core/prisma-client';

import { filterVisiblePages } from 'components/common/PageLayout/components/PageNavigation/PageNavigation';
import type { StaticPageType } from 'lib/metrics/mixpanel/interfaces/PageEvent';
import { getPermissionsClient } from 'lib/permissions/api/routers';

import { getLastPageView, staticPagesToDirect } from './getDefaultPage';

// get default page when we have a space domain
export async function getDefaultPageForSpace({ spaceId, userId }: { spaceId: string; userId: string }) {
  const lastPageView = await getLastPageView({ userId, spaceId });

  if (lastPageView) {
    // handle forum posts
    if (lastPageView.post) {
      return `/forum?postId=${lastPageView.post.id}`;
    }
    // handle pages
    else if (lastPageView.page) {
      return `/${lastPageView.page.path}`;
    }
    // handle static pages
    else {
      const staticPath = staticPagesToDirect[lastPageView.pageType as StaticPageType];
      if (staticPath) {
        return staticPath;
      }
    }
  }

  const { client } = await getPermissionsClient({
    resourceId: spaceId,
    resourceIdType: 'space'
  });

  const accessiblePageIds = await client.pages.getAccessiblePageIds({
    spaceId,
    userId,
    archived: false
  });

  const pages = await prisma.page.findMany({
    where: {
      id: {
        in: accessiblePageIds
      }
    }
  });

  const pageMap = pages.reduce<Record<string, PageMeta>>((acc, page) => {
    acc[page.id] = page;
    return acc;
  }, {});

  // Find the first top-level page that is not card and hasn't been deleted yet.
  const topLevelPages = filterVisiblePages(pageMap);

  const sortedPages = pageTree.sortNodes(topLevelPages);
  const firstPage = sortedPages[0];

  if (firstPage) {
    return `/${firstPage.path}`;
  } else {
    return `/members`;
  }
}
