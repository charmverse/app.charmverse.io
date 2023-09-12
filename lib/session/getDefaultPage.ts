import { log } from '@charmverse/core/log';
import { PageType } from '@charmverse/core/prisma';
import type { Space, UserSpaceAction } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import type { StaticPageType } from 'lib/metrics/mixpanel/interfaces/PageEvent';
import { isSpaceDomain } from 'lib/spaces/utils';
import { getSpaceUrl } from 'lib/utilities/browser';

export const staticPagesToDirect: { [key in StaticPageType]?: string } = {
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
