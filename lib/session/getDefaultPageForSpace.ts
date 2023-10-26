import type { PageMeta } from '@charmverse/core/pages';
import { pageTree } from '@charmverse/core/pages/utilities';
import type { Space } from '@charmverse/core/prisma';
import { PageType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import type { StaticPageType, PageEventMap } from 'lib/metrics/mixpanel/interfaces/PageEvent';
import { filterVisiblePages } from 'lib/pages/filterVisiblePages';
import { getPermissionsClient } from 'lib/permissions/api/routers';
import { getSubdomainPath, getSpaceUrl, fullyDecodeURI } from 'lib/utilities/browser';

type ViewMeta = PageEventMap['page_view']['meta'];

const staticPagesToDirect: { [key in StaticPageType]?: string } = {
  bounties_list: '/bounties',
  forum_posts_list: '/forum',
  members_list: '/members',
  proposals_list: '/proposals'
};

const pageTypes = Object.keys(PageType).concat('post', ...Object.keys(staticPagesToDirect));

export async function getDefaultPageForSpace({
  space,
  host,
  userId
}: {
  space: Pick<Space, 'id' | 'domain' | 'customDomain'>;
  host?: string;
  userId: string;
}) {
  const defaultPage = await getDefaultPageForSpaceRaw({ space, host, userId });
  // encode to handle Japanese characters
  // call fullyDecodeURI to handle cases where we saved the pathname with encoded characters
  return encodeURI(fullyDecodeURI(defaultPage));
}

// get default page when we have a space domain
async function getDefaultPageForSpaceRaw({
  space,
  host,
  userId
}: {
  space: Pick<Space, 'id' | 'domain' | 'customDomain'>;
  host?: string;
  userId: string;
}) {
  const { id: spaceId } = space;
  const lastPageView = await getLastPageView({ userId, spaceId });

  const defaultSpaceUrl = getSpaceUrl(space, host);
  if (lastPageView) {
    const pathname = (lastPageView.meta as ViewMeta)?.pathname;
    if (pathname) {
      return getSubdomainPath(pathname, space, host);
    }
    // reconstruct the URL if no pathname is saved (should not be an issue a few weeks after the release of this code on Sep 12 2023)
    // handle forum posts
    if (lastPageView.post) {
      return `${defaultSpaceUrl}/forum?postId=${lastPageView.post.id}`;
    }
    // handle pages
    else if (lastPageView.page) {
      return `${defaultSpaceUrl}/${lastPageView.page.path}`;
    }
    // handle static pages
    else {
      const staticPath = staticPagesToDirect[lastPageView.pageType as StaticPageType];
      if (staticPath) {
        return `${defaultSpaceUrl}${staticPath}`;
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
    },
    select: {
      createdAt: true,
      id: true,
      index: true,
      path: true,
      type: true,
      parentId: true
    }
  });

  const pageMap = pages.reduce<Record<string, (typeof pages)[number]>>((acc, page) => {
    acc[page.id] = page;
    return acc;
  }, {});

  // Find the first top-level page that is not card and hasn't been deleted yet.
  const visiblePages = filterVisiblePages(pageMap);
  const topLevelPages = visiblePages.filter((page) => !page.parentId);
  const pagesToLookup = topLevelPages.length ? topLevelPages : visiblePages;

  // TODO: simplify types of sortNodes input to only be index and createdAt
  const sortedPages = pageTree.sortNodes(pagesToLookup as PageMeta[]);

  const firstPage = sortedPages[0];
  if (firstPage) {
    return `${defaultSpaceUrl}/${firstPage.path}`;
  } else {
    return `${defaultSpaceUrl}/members`;
  }
}

function getLastPageView({ userId, spaceId }: { userId: string; spaceId?: string }) {
  return prisma.userSpaceAction.findFirst({
    where: {
      createdBy: userId,
      action: 'view_page',
      pageType: {
        in: pageTypes
      },
      spaceId
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      meta: true,
      spaceId: true,
      pageType: true,
      page: {
        select: {
          id: true,
          path: true
        }
      },
      post: {
        select: {
          id: true,
          path: true
        }
      }
    }
  });
}
