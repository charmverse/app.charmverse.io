import { log } from '@charmverse/core/log';
import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { isSpaceDomain } from 'lib/spaces/utils';
import { getSpaceUrl } from '@packages/lib/utils/browser';

export function getDefaultPage({
  lastViewedSpaceId,
  returnUrl,
  spaces,
  userId,
  host
}: {
  lastViewedSpaceId?: string | null;
  returnUrl?: string;
  spaces: Pick<Space, 'id' | 'domain' | 'customDomain'>[];
  userId?: string;
  host?: string;
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
    const defaultSpace = spaces.find((space) => space.id === lastViewedSpaceId);
    const defaultSpaceUrl = getSpaceUrl(defaultSpace || spaces[0], host);
    log.info('Redirect user to default workspace', { userId, host, defaultSpaceUrl });
    return defaultSpaceUrl;
  }
}

export function getLastViewedSpaceId({ userId }: { userId: string }) {
  return prisma.userSpaceAction.findFirst({
    where: {
      createdBy: userId,
      action: 'view_page'
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      spaceId: true
    }
  });
}
