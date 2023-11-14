import type { ReactNode } from 'react';
import { useMemo, createContext, useContext, useState, useEffect } from 'react';

import { useSearchByDomain } from 'charmClient/hooks/spaces';
import type { SpaceWithGates } from 'lib/spaces/interfaces';
import { getCustomDomainFromHost } from 'lib/utilities/domains/getCustomDomainFromHost';

import { useUser } from './useUser';

export type IBaseCurrentDomainContext = {
  isSpaceLoading: boolean;
  spaceFromPath?: SpaceWithGates | null;
  customDomain?: string | null;
};

export const BaseCurrentDomainContext = createContext<Readonly<IBaseCurrentDomainContext>>({
  isSpaceLoading: true,
  spaceFromPath: undefined,
  customDomain: undefined
});

export function BaseCurrentDomainProvider({ children }: { children: ReactNode }) {
  const [customDomain, setCustomDomain] = useState<string | null>();
  const { data: spaceFromPath, isLoading: isSpaceLoading } = useSearchByDomain(customDomain || '');
  const { user } = useUser();

  useEffect(() => {
    if (typeof window !== 'undefined' && !user) {
      const customDomainFromHost = getCustomDomainFromHost(window?.location.host);

      setCustomDomain(customDomainFromHost);
    }
  }, [typeof window !== 'undefined', !user]);

  const value = useMemo(() => {
    return { isSpaceLoading, spaceFromPath, customDomain };
  }, [customDomain, isSpaceLoading, spaceFromPath]);

  return <BaseCurrentDomainContext.Provider value={value}>{children}</BaseCurrentDomainContext.Provider>;
}

// This should be utilised only when the user is not logged in
export const useBaseCurrentDomain = () => useContext(BaseCurrentDomainContext);
