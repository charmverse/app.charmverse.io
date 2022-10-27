import type { MemberProperty, MemberPropertyPermission } from '@prisma/client';
import type { ReactNode } from 'react';
import { useCallback, createContext, useContext, useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { CreateMemberPropertyPayload, CreateMemberPropertyPermissionInput, MemberPropertyWithPermissions } from 'lib/members/interfaces';

import { useCurrentSpace } from './useCurrentSpace';

type Context = {
  properties: MemberPropertyWithPermissions[] | undefined;
  addProperty: (property: CreateMemberPropertyPayload) => Promise<MemberProperty>;
  updateProperty: (property: Partial<MemberProperty> & { id: string }) => Promise<MemberProperty>;
  deleteProperty: (id: string) => Promise<void>;
  addPropertyPermissions: (propertyId: string, permission: CreateMemberPropertyPermissionInput[]) => Promise<MemberPropertyPermission[]>;
  removePropertyPermission: (permission: MemberPropertyPermission) => Promise<void>;
};

const MemberPropertiesContext = createContext<Readonly<Context>>({
  properties: undefined,
  addProperty: () => Promise.resolve({} as any),
  updateProperty: () => Promise.resolve({} as any),
  deleteProperty: () => Promise.resolve(),
  addPropertyPermissions: () => Promise.resolve({} as any),
  removePropertyPermission: () => Promise.resolve()
});

export function MemberPropertiesProvider ({ children }: { children: ReactNode }) {
  const [space] = useCurrentSpace();

  const { data: properties, mutate: mutateProperties } = useSWR(() => space ? `members/properties/${space?.id}` : null, () => {
    return charmClient.members.getMemberProperties(space!.id);
  });

  const addProperty = useCallback(async (propertyData: CreateMemberPropertyPayload) => {
    if (space) {
      const createdProperty = await charmClient.members.createMemberProperty(space.id, propertyData);
      const propertyWithPermissions = { ...createdProperty, permissions: [] };
      mutateProperties(state => {
        return state ? [...state, propertyWithPermissions] : [propertyWithPermissions];
      });

      return propertyWithPermissions;
    }
  }, [space?.id]);

  const updateProperty = useCallback(async (propertyData: Partial<MemberProperty> & { id: string }) => {
    if (space) {
      const updatedProperty = await charmClient.members.updateMemberProperty(space.id, propertyData);
      mutateProperties(state => {
        if (state) {
          return state.map(p => p.id === updatedProperty.id ? { ...p, ...updatedProperty } : p);
        }
        return state;
      });

      return updatedProperty;
    }
  }, [space?.id]);

  const deleteProperty = useCallback(async (id: string) => {
    if (space) {
      await charmClient.members.deleteMemberProperty(space.id, id);
      mutateProperties(state => {
        return state ? state.filter(p => p.id !== id) : undefined;
      });
    }
  }, [space?.id]);

  const addPropertyPermissions = useCallback(async (memberPropertyId: string, permissionsData: CreateMemberPropertyPermissionInput[]) => {
    if (space) {
      const promises = permissionsData.map((permissionData) => charmClient.members.createMemberPropertyPermission(space.id, permissionData));
      const createdPermissions = await Promise.all(promises);

      mutateProperties(state => {
        return state ? state.map(p => {
          if (p.id === memberPropertyId) {
            return {
              ...p,
              permissions: p.permissions ? [...p.permissions, ...createdPermissions] : [...createdPermissions]
            };
          }

          return p;
        }) : undefined;
      });

      return createdPermissions;
    }
  }, [space?.id]);

  const removePropertyPermission = useCallback(async (permission: MemberPropertyPermission) => {
    if (space) {
      await charmClient.members.deleteMemberPropertyPermission(space.id, permission.id);

      mutateProperties(state => {
        return state ? state.map(p => {
          if (p.id === permission.memberPropertyId) {
            return {
              ...p,
              permissions: p.permissions?.filter(perm => permission.id !== perm.id) || []
            };
          }

          return p;
        }) : undefined;
      });
    }
  }, [space?.id]);

  const value = useMemo(() => ({
    properties,
    addProperty,
    updateProperty,
    deleteProperty,
    removePropertyPermission,
    addPropertyPermissions
  }) as Context, [properties, addProperty]);

  return (
    <MemberPropertiesContext.Provider value={value}>
      {children}
    </MemberPropertiesContext.Provider>
  );
}

export const useMemberProperties = () => useContext(MemberPropertiesContext);
