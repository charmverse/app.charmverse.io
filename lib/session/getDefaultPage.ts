import { log } from '@charmverse/core/log';
import type { PageMeta } from '@charmverse/core/pages';
import { pageTree } from '@charmverse/core/pages/utilities';
import { PageType } from '@charmverse/core/prisma';
import type { Space, UserSpaceAction } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { filterVisiblePages } from 'components/common/PageLayout/components/PageNavigation/PageNavigation';
import type { StaticPageType } from 'lib/metrics/mixpanel/interfaces/PageEvent';
import { getPermissionsClient } from 'lib/permissions/api/routers';
import { isSpaceDomain } from 'lib/spaces/utils';
import { getSpaceUrl } from 'lib/utilities/browser';

const staticPagesToDirect: { [key in StaticPageType]?: string } = {
  bounties_list: '/bounties',
  forum_posts_list: '/forum',
  members_list: '/members',
  proposals_list: '/proposals'
};

const pageTypes = Object.keys(PageType).concat('post', ...Object.keys(staticPagesToDirect));

export function getDefaultPage({
  lastPageView,
  returnUrl,
  spaces,
  userId
}: {
  lastPageView?: Pick<UserSpaceAction, 'spaceId'> | null;
  returnUrl?: string;
  spaces: Pick<Space, 'id' | 'domain'>[];
  userId?: string;
}) {
  // Send the user in priority to the invites page if they logged in looking to join a space
  if (returnUrl?.match('join') || returnUrl?.match('invite')) {
    log.info('Redirect user to given url', { userId });
    return returnUrl;
  } else if (spaces.length === 0 && !isSpaceDomain(returnUrl?.replaceAll('/', ''))) {
    // Note that a user logging in will be redirected to /signup, because the 'user' and 'spaces' are loaded async after the wallet address appears.
    log.info('Redirect user to create a space', { userId });
    return '/createSpace';
    // send to signup for users without a workspace unless they are being redirected to an existing workspace
  } else if (returnUrl) {
    log.info('Redirect user to given url', { userId });
    return returnUrl;
  } else {
    const defaultWorkspace = getDefaultWorkspaceUrl(spaces, lastPageView?.spaceId);
    log.info('Redirect user to default workspace', { userId });
    return defaultWorkspace;
  }
}

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

export function getDefaultWorkspaceUrl(spaces: Pick<Space, 'id' | 'domain'>[], lastSpaceId?: string | null) {
  const defaultSpace = spaces.find((space) => space.id === lastSpaceId);
  return getSpaceUrl(defaultSpace || spaces[0]);
}

export function getLastPageView({ userId, spaceId }: { userId: string; spaceId?: string }) {
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
