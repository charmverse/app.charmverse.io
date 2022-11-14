import type { Role } from '@prisma/client';
import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import type { RoleupWithMembers } from '../lib/roles';

export default function useRoles () {
  const space = useCurrentSpace();

  const { data: roles } = useSWR(() => space ? `roles/${space.id}` : null, () => space && charmClient.listRoles(space.id));

  async function createRole (role: Partial<Role>): Promise<Role> {
    role.spaceId = space?.id;
    const createdRole = await charmClient.createRole(role);
    refreshRoles();
    return createdRole;
  }

  async function updateRole (role: Partial<Role>): Promise<Role> {
    role.spaceId = space?.id;
    const updatedRole = await charmClient.updateRole(role);
    refreshRoles();
    return updatedRole;
  }

  async function deleteRole (roleId: string) {
    await charmClient.deleteRole(roleId);
    refreshRoles();
  }

  async function assignRoles (roleId: string, userIds: string[]) {
    if (space) {
      await Promise.all(userIds.map(userId => charmClient.assignRole({
        roleId,
        userId,
        spaceId: space.id
      })));
      refreshRoles();
    }
  }

  async function unassignRole (roleId: string, userId: string) {
    if (space) {
      await charmClient.unassignRole({
        roleId,
        userId,
        spaceId: space.id
      });
      refreshRoles();
    }
  }

  function refreshRoles () {
    if (space) {
      mutate(`roles/${space.id}`);
    }
  }

  const roleups: RoleupWithMembers[] = useMemo(() => {
    return (
      (roles ?? []).map(r => {
        const rollup: RoleupWithMembers = {
          id: r.id,
          name: r.name,
          members: r.spaceRolesToRole.length,
          users: r.spaceRolesToRole.map(sr => {
            return sr.spaceRole.user;
          })
        };
        return rollup;
      })
    );
  }, [roles]);

  return {
    createRole,
    updateRole,
    deleteRole,
    assignRoles,
    unassignRole,
    refreshRoles,
    roles,
    roleups
  };
}
