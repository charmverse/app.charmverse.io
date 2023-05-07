import { useEffect } from 'react';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';

export function useSpaceGatesReevaluate() {
  const { user, refreshUser } = useUser();
  const currentSpace = useCurrentSpace();
  const { getStoredSignature, account } = useWeb3AuthSig();

  useEffect(() => {
    const reevaluateRoles = async () => {
      if (user?.id && currentSpace?.id && account) {
        const authSig = getStoredSignature();
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
