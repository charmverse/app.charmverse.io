import { useEffect } from 'react';

import charmClient from 'charmClient';
import { useCurrentSpaceId } from 'hooks/useCurrentSpaceId';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';

export function useSpaceGatesReevaluate() {
  const { user, refreshUser } = useUser();
  const { currentSpaceId } = useCurrentSpaceId();
  const { getStoredSignature, account } = useWeb3AuthSig();

  useEffect(() => {
    const reevaluateRoles = async () => {
      if (user?.id && currentSpaceId && account) {
        const authSig = getStoredSignature();
        if (!authSig) return;

        const newRoles = await charmClient.tokenGates.reevaluateRoles({
          spaceId: currentSpaceId,
          userId: user.id,
          authSig
        });

        if (newRoles.length) {
          refreshUser();
        }
      }
    };

    reevaluateRoles();
  }, [account, currentSpaceId, user?.id]);
}
