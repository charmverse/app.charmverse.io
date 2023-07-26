import type { Space, SpaceRole } from '@charmverse/core/prisma';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';

import charmClient from 'charmClient';
import { useSharedPage } from 'hooks/useSharedPage';
import { filterSpaceByDomain } from 'lib/spaces/filterSpaceByDomain';

import { useSpaces } from './useSpaces';
import { useUser } from './useUser';

export function useCurrentSpace(): {
  space?: Space;
  isLoading: boolean;
  refreshCurrentSpace: () => void;
  spaceRole?: SpaceRole;
} {
  const router = useRouter();
  const { spaces, isLoaded: isSpacesLoaded, setSpace } = useSpaces();
  const { user } = useUser();
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

  const spaceToReturn = space ?? (publicSpace || undefined);

  const spaceRole = useMemo(() => {
    if (!user || !spaceToReturn) {
      return undefined;
    }
    return user.spaceRoles.find((sr) => sr.spaceId === spaceToReturn.id);
  }, [user, spaceToReturn]);

  // if page is public and we are not loading space anymore OR if spaces are loaded
  if (isSpacesLoaded || isSharedPageLoaded) {
    return { space: spaceToReturn, isLoading: false, refreshCurrentSpace, spaceRole };
  }
  return { isLoading: true, refreshCurrentSpace };
}
