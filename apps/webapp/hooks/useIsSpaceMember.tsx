import type { ReactNode } from 'react';
import { useContext, createContext, useMemo } from 'react';

import { useSpaceGatesReevaluate } from 'components/_app/hooks/useSpaceGatesReevaluate';

import { useCurrentSpace } from './useCurrentSpace';
import { useUser } from './useUser';

type Context = {
  isSpaceMember: boolean;
};

const IsSpaceMemberContext = createContext<Readonly<Context>>({
  isSpaceMember: false
});

export function IsSpaceMemberProvider({ children }: { children: ReactNode }) {
  const { space } = useCurrentSpace();
  const { user } = useUser();
  const value = useMemo(() => {
    if (!user || !space) {
      return {
        isSpaceMember: false
      };
    }

    return {
      isSpaceMember: !!user?.spaceRoles.some((sr) => sr.spaceId === space?.id)
    } as Context;
  }, [user, space]);

  useSpaceGatesReevaluate();

  return <IsSpaceMemberContext.Provider value={value}>{children}</IsSpaceMemberContext.Provider>;
}
export const useIsSpaceMember = () => useContext(IsSpaceMemberContext);
