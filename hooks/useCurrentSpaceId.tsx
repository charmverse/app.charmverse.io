import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useEffect, createContext, useContext, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
// keep track of the focused page (may be different from what's in the URL or header)

type ICurrentSpaceContext = {
  currentSpaceId: string;
  setCurrentSpaceId: Dispatch<SetStateAction<string>>;
};

export const CurrentSpaceContext = createContext<Readonly<ICurrentSpaceContext>>({
  currentSpaceId: '',
  setCurrentSpaceId: () => ''
});

export function CurrentSpaceProvider({ children }: { children: ReactNode }) {
  const [currentSpaceId, setCurrentSpaceId] = useState<string>('');
  const { user, refreshUser } = useUser();
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

  const value: ICurrentSpaceContext = useMemo(
    () => ({
      currentSpaceId,
      setCurrentSpaceId
    }),
    [currentSpaceId]
  );

  return <CurrentSpaceContext.Provider value={value}>{children}</CurrentSpaceContext.Provider>;
}

export const useCurrentSpaceId = () => useContext(CurrentSpaceContext);
