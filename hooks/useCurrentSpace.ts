import { useRouter } from 'next/router';
import { Space } from '@prisma/client';
import { useCallback, useMemo, useEffect, useState } from 'react';
import { AvailableSpacePermissions, SpacePermissionFlags } from 'lib/permissions/spaces/client';
import charmClient from 'charmClient';
import { useSpaces } from './useSpaces';
import { useUser } from './useUser';

export function useCurrentSpace () {

  const router = useRouter();
  const [user] = useUser();
  const [spaces, setSpaces] = useSpaces();
  const [currentUserSpacePermissions, setCurrentUserSpacePermissions] = useState<SpacePermissionFlags>(new AvailableSpacePermissions());

  const { domain } = router.query;
  const space = useMemo(() => spaces.find(w => w.domain === domain), [domain, spaces]);

  const setSpace = useCallback((_space: Space) => {
    const newSpaces = spaces.map(s => s.id === _space.id ? _space : s);
    setSpaces(newSpaces);
  }, [spaces, setSpaces]);

  useEffect(() => {

    if (space && user) {
      charmClient.computeUserSpacePermissions({
        spaceId: space.id
      }).then(permissions => {
        setCurrentUserSpacePermissions(permissions);
      });
    }

  }, [space, user]);

  return [space, setSpace, currentUserSpacePermissions] as const;
}
