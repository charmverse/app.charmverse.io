import { useEffect } from 'react';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';

export function useSpaceGatesReevaluate() {
  const { user, refreshUser } = useUser();
  const { space: currentSpace } = useCurrentSpace();
  const { getStoredSignature, account } = useWeb3Account();

  useEffect(() => {
    const reevaluateRoles = async () => {
      if (user?.id && currentSpace?.id && account) {
        const authSig = getStoredSignature(account);
        if (!authSig) return;

        const newRoles = await charmClient.tokenGates.reevaluateRoles({
          spaceId: currentSpace.id,
          userId: user.id,
          authSig
        });

        if (newRoles.length) {
          refreshUser();
        }
      }
    };

    reevaluateRoles();
  }, [account, currentSpace?.id, user?.id]);
}
