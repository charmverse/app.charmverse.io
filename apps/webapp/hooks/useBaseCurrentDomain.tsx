import type { Space } from '@charmverse/core/prisma-client';
import type { ReactNode } from 'react';
import { useMemo, createContext, useContext, useState, useEffect } from 'react';

import { useSearchByDomain } from 'charmClient/hooks/spaces';
import { getCustomDomainFromHost } from '@packages/lib/utils/domains/getCustomDomainFromHost';

export type IBaseCurrentDomainContext = {
  isSpaceLoading: boolean;
  spaceFromPath?: Space | null;
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
      spaceFromPath
    };
  }, [customDomain, isSpaceLoading, spaceFromPath]);

  return <BaseCurrentDomainContext.Provider value={value}>{children}</BaseCurrentDomainContext.Provider>;
}

// This should be utilised only when the user is not logged in
export const useBaseCurrentDomain = () => useContext(BaseCurrentDomainContext);
