import type { Space } from '@charmverse/core/prisma';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

import charmClient from 'charmClient';
import { useSharedPage } from 'hooks/useSharedPage';
import { filterSpaceByDomain } from 'lib/spaces/filterSpaceByDomain';

import { useSpaces } from './useSpaces';

export function useCurrentSpace(): { space?: Space; isLoading: boolean; refreshCurrentSpace: () => void } {
  const router = useRouter();
  const { spaces, isLoaded: isSpacesLoaded, setSpace } = useSpaces();
  const { publicSpace, accessChecked: publicAccessChecked, isPublicPath } = useSharedPage();
  const isSharedPageLoaded = isPublicPath && publicAccessChecked;
  // Support for extracting domain from logged in view or shared bounties view
  // domain in query can be either space domain or custom domain
  const domainOrCustomDomain = router.query.domain;

  const space = filterSpaceByDomain(spaces, domainOrCustomDomain as string);

  const refreshCurrentSpace = useCallback(() => {
    if (space) {
      charmClient.spaces.getSpace(space.id).then((refreshSpace) => setSpace(refreshSpace));
    }
  }, [space]);

  // if page is public and we are not loading space anymore OR if spaces are loaded
  if (isSpacesLoaded || isSharedPageLoaded) {
    return { space: space ?? (publicSpace || undefined), isLoading: false, refreshCurrentSpace };
  }
  return { isLoading: true, refreshCurrentSpace };
}
