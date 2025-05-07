import { useEffect } from 'react';

import { useReevaluateRoles } from 'charmClient/hooks/tokenGates';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';

export function useSpaceGatesReevaluate() {
  const { user, refreshUser } = useUser();
  const { space: currentSpace } = useCurrentSpace();
  const { trigger: reevaluateRoles } = useReevaluateRoles();

  useEffect(() => {
    const reevaluatedRoles = async () => {
      if (user?.id && currentSpace?.id) {
        const newRoles = await reevaluateRoles({
          spaceId: currentSpace.id
        });

        if (newRoles?.length) {
          refreshUser();
        }
      }
    };

    reevaluatedRoles();
  }, [currentSpace?.id, user?.id]);
}
