import type { ReactNode } from 'react';
import { useMemo, createContext, useContext, useState, useEffect } from 'react';

import { useSearchByDomain } from 'charmClient/hooks/spaces';
import type { SpaceWithGates } from 'lib/spaces/interfaces';
import { getCustomDomainFromHost } from 'lib/utilities/domains/getCustomDomainFromHost';

export type IBaseCurrentDomainContext = {
  isSpaceLoading: boolean;
  spaceFromPath?: SpaceWithGates | null;
  customDomain?: string | null;
  isCustomDomain: boolean;
};

export const BaseCurrentDomainContext = createContext<Readonly<IBaseCurrentDomainContext>>({
  isSpaceLoading: true,
  spaceFromPath: undefined,
  customDomain: undefined,
  isCustomDomain: false
});

export function BaseCurrentDomainProvider({ children }: { children: ReactNode }) {
  const [customDomain, setCustomDomain] = useState<string | null>();
  const { data: spaceFromPath, isLoading: isSpaceLoading } = useSearchByDomain(customDomain || '');
  const isCustomDomain = Boolean(customDomain && spaceFromPath?.name && spaceFromPath.isCustomDomainVerified);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const customDomainFromHost = getCustomDomainFromHost(window?.location.host);

      setCustomDomain(customDomainFromHost);
    }
  }, []);

  const value = useMemo(() => {
    return {
      customDomain,
      isSpaceLoading: isSpaceLoading || customDomain === undefined,
      spaceFromPath,
      isCustomDomain
    };
  }, [customDomain, isSpaceLoading, spaceFromPath, isCustomDomain]);

  return <BaseCurrentDomainContext.Provider value={value}>{children}</BaseCurrentDomainContext.Provider>;
}

// This should be utilised only when the user is not logged in
export const useBaseCurrentDomain = () => useContext(BaseCurrentDomainContext);
