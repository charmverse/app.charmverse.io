import type { MemberProperty } from '@prisma/client';
import type { ReactNode } from 'react';
import { useCallback, createContext, useContext, useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';

import { useCurrentSpace } from './useCurrentSpace';

type Context = {
  properties: MemberProperty[] | undefined;
  addProperty: (property: Partial<MemberProperty>) => Promise<MemberProperty>;
  updateProperty: (property: Partial<MemberProperty> & { id: string }) => Promise<MemberProperty>;
  deleteProperty: (id: string) => Promise<void>;
};

const MemberPropertiesContext = createContext<Readonly<Context>>({
  properties: undefined,
  addProperty: () => Promise.resolve({} as any),
  updateProperty: () => Promise.resolve({} as any),
  deleteProperty: () => Promise.resolve()
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

      return createdProperty;
    }
  }, [space]);

  const updateProperty = useCallback(async (propertyData: Partial<MemberProperty> & { id: string }) => {
    if (space) {
      const updatedProperty = await charmClient.members.updateMemberProperty(space.id, propertyData);
      mutateProperties(state => {
        return state ? state.map(p => p.id === updatedProperty.id ? { ...updatedProperty } : p) : [updatedProperty];
      });

      return updatedProperty;
    }
  }, [space]);

  const deleteProperty = useCallback(async (id: string) => {
    if (space) {
      await charmClient.members.deleteMemberProperty(space.id, id);
      mutateProperties(state => {
        return state ? state.filter(p => p.id !== id) : undefined;
      });
    }
  }, [space]);

  const value = useMemo(() => ({ properties, addProperty, updateProperty, deleteProperty }) as Context, [properties, addProperty]);

  return (
    <MemberPropertiesContext.Provider value={value}>
      {children}
    </MemberPropertiesContext.Provider>
  );
}

export const useMemberProperties = () => useContext(MemberPropertiesContext);
