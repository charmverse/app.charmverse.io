import { useRouter } from 'next/router';
import { Space } from '@prisma/client';
import { useCallback, useMemo, useEffect, useState } from 'react';
import { AvailableSpacePermissions, SpacePermissionFlags } from 'lib/permissions/spaces/client';
import charmClient from 'charmClient';
import useSWR from 'swr';
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

  const { data } = useSWR(() => space ? `permissions-${space.id}` : null, () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return charmClient.computeUserSpacePermissions({ spaceId: space!.id });
  }, { revalidateOnFocus: true, focusThrottleInterval: 0 });

  useEffect(() => {
    if (data) {
      setCurrentUserSpacePermissions(data);
    }

  }, [data]);

  return [space, setSpace, currentUserSpacePermissions] as const;
}
