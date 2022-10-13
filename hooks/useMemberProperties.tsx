import type { MemberProperty } from '@prisma/client';
import type { ReactNode } from 'react';
import { useCallback, createContext, useContext, useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';

import { useCurrentSpace } from './useCurrentSpace';

type Context = {
  properties: MemberProperty[] | undefined;
};

const MemberPropertiesContext = createContext<Readonly<Context>>({
  properties: undefined
});

export function MemberPropertiesProvider ({ children }: { children: ReactNode }) {
  const [space] = useCurrentSpace();

  const { data: properties, mutate: mutateProperties } = useSWR(() => space ? `members/properties/${space?.id}` : null, () => {
    return charmClient.members.getMemberProperties(space!.id);
  });

  const addProperty = useCallback(async (propertyData: Partial<MemberProperty>) => {
    if (space) {
      const createdProperty = await charmClient.members.createMemberProperty(space.id, propertyData);
      mutateProperties(state => {
        return state ? [...state, createdProperty] : [createdProperty];
      });
    }
  }, [space]);

  const value = useMemo(() => ({ properties, addProperty }) as Context, [properties, addProperty]);

  return (
    <MemberPropertiesContext.Provider value={value}>
      {children}
    </MemberPropertiesContext.Provider>
  );
}

export const useMemberProperties = () => useContext(MemberPropertiesContext);
