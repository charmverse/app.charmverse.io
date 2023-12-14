import { useEffect } from 'react';

import { useReevaluateRoles } from 'charmClient/hooks/tokenGates';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';

export function useSpaceGatesReevaluate() {
  const { user, refreshUser } = useUser();
  const { space: currentSpace } = useCurrentSpace();
  const { getStoredSignature, account } = useWeb3Account();
  const { trigger: reevaluateRoles } = useReevaluateRoles();

  useEffect(() => {
    const reevaluatedRoles = async () => {
      if (user?.id && currentSpace?.id && account) {
        const authSig = getStoredSignature(account);
        if (!authSig) return;

        const newRoles = await reevaluateRoles({
          spaceId: currentSpace.id,
          userId: user.id,
          authSig
        });

        if (newRoles?.length) {
          refreshUser();
        }
      }
    };

    reevaluatedRoles();
  }, [account, currentSpace?.id, user?.id]);
}
