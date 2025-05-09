import { useEffect } from 'react';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';

export function useSyncSummonSpaceRoles() {
  const { user, refreshUser } = useUser();
  const { space: currentSpace } = useCurrentSpace();

  useEffect(() => {
    const syncSummonSpaceRoles = async () => {
      if (user?.id && currentSpace?.id && currentSpace?.xpsEngineId) {
        const { totalSpaceRolesAdded, totalSpaceRolesUpdated } = await charmClient.summon.syncSpaceRoles({
          spaceId: currentSpace.id
        });

        if (totalSpaceRolesAdded !== 0 || totalSpaceRolesUpdated !== 0) {
          refreshUser();
        }
      }
    };

    syncSummonSpaceRoles();
  }, [currentSpace?.id, user?.id]);
}
