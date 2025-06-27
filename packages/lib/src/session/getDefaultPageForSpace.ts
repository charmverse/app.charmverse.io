import type { Space } from '@charmverse/core/prisma';
import { PageType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { PageMeta } from '@packages/core/pages';
import { pageTree } from '@packages/core/pages/mapPageTree';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { fullyDecodeURI, getSpaceUrl, getSubdomainPath } from '@packages/lib/utils/browser';
import { getCustomDomainFromHost } from '@packages/lib/utils/domains/getCustomDomainFromHost';
import type { PageEventMap, StaticPageType } from '@packages/metrics/mixpanel/interfaces/PageEvent';

import { filterVisiblePages } from 'lib/pages/filterVisiblePages';

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
  space: Pick<Space, 'id' | 'domain' | 'customDomain' | 'homePageId'>;
  host?: string;
  userId?: string;
}) {
  const defaultPage = await (userId
    ? getDefaultPageForSpaceRaw({ space, host, userId })
    : getDefaultPageForSpaceWithNonLoggedInUser({ space, host }));
  // encode to handle Japanese characters
  // call fullyDecodeURI to handle cases where we saved the pathname with encoded characters
  return defaultPage ? encodeURI(fullyDecodeURI(defaultPage)) : null;
}

async function getDefaultPageForSpaceWithNonLoggedInUser({
  space,
  host
}: {
  space: Pick<Space, 'id' | 'domain' | 'customDomain' | 'homePageId'>;
  host?: string;
}): Promise<string | null> {
  if (!space.homePageId) {
    return null;
  }

  const page = await prisma.page.findFirst({
    where: {
      id: space.homePageId,
      permissions: {
        some: {
          public: true
        }
      }
    }
  });

  if (page) {
    const defaultSpaceUrl = getSpaceUrl(space, host);
    return `${defaultSpaceUrl}/${page.path}`;
  }

  return null;
}

// get default page when we have a space domain
async function getDefaultPageForSpaceRaw({
  space,
  host,
  userId
}: {
  space: Pick<Space, 'id' | 'domain' | 'customDomain' | 'homePageId'>;
  host?: string;
  userId: string;
}) {
  const { id: spaceId } = space;
  const lastPageView = await getLastPageView({ userId, spaceId });
  const defaultSpaceUrl = getSpaceUrl(space, host);

  if (lastPageView && !space.homePageId) {
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
    filter: 'not_card',
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
  const homePage = space.homePageId && pageMap[space.homePageId];
  if (homePage) {
    return `${defaultSpaceUrl}/${homePage.path}`;
  } else if (firstPage) {
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
