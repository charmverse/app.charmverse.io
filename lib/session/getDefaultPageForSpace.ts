import type { PageMeta } from '@charmverse/core/pages';
import { pageTree } from '@charmverse/core/pages/utilities';
import type { Space } from '@charmverse/core/prisma';
import { PageType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import type { StaticPageType, PageEventMap } from 'lib/metrics/mixpanel/interfaces/PageEvent';
import { filterVisiblePages } from 'lib/pages/filterVisiblePages';
import { getPermissionsClient, permissionsApiClient } from 'lib/permissions/api/routers';
import { getSubdomainPath, getSpaceUrl, fullyDecodeURI } from 'lib/utilities/browser';

type ViewMeta = PageEventMap['page_view']['meta'];

const staticPagesToDirect: { [key in StaticPageType]?: string } = {
  bounties_list: '/rewards',
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
    // grab the original path a user was on to include query params like filters, etc.
    const pathname = (lastPageView.meta as ViewMeta)?.pathname;
    const fullPathname = pathname && getSubdomainPath(pathname, space, host);
    // handle forum posts
    if (lastPageView.post) {
      // use the original path if it was the actual post page
      if (fullPathname?.includes(lastPageView.post.path)) {
        return fullPathname;
      }
      return `${defaultSpaceUrl}/forum/post/${lastPageView.post.path}`;
    }
    // handle pages
    else if (lastPageView.page) {
      // use the original path if it was the actual post page
      if (fullPathname?.includes(lastPageView.page.path)) {
        return fullPathname;
      }
      return `${defaultSpaceUrl}/${lastPageView.page.path}`;
    } else {
      if (fullPathname) {
        return fullPathname;
      }
      // handle static pages - this is probably not necessary since pathname is always defined now
      const staticPath = staticPagesToDirect[lastPageView.pageType as StaticPageType];
      if (staticPath) {
        return `${defaultSpaceUrl}${staticPath}`;
      }
    }
  }

  const accessiblePageIds = await permissionsApiClient.pages.getAccessiblePageIds({
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
