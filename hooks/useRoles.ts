import type { Role } from '@prisma/client';
import useSWR, { mutate } from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

export function useRoles() {
  const space = useCurrentSpace();

  const { data: roles } = useSWR(
    () => (space ? `roles/${space.id}` : null),
    () => space && charmClient.roles.listRoles(space.id)
  );

  async function createRole(role: Partial<Role>): Promise<Role> {
    role.spaceId = space?.id;
    const createdRole = await charmClient.roles.createRole(role);
    refreshRoles();
    return createdRole;
  }

  async function updateRole(role: Partial<Role>): Promise<Role> {
    role.spaceId = space?.id;
    const updatedRole = await charmClient.roles.updateRole(role);
    refreshRoles();
    return updatedRole;
  }

  async function deleteRole(roleId: string) {
    await charmClient.roles.deleteRole(roleId);
    refreshRoles();
  }

  async function assignRoles(roleId: string, userIds: string[]) {
    if (space) {
      await Promise.all(
        userIds.map((userId) =>
          charmClient.roles.assignRole({
            roleId,
            userId,
            spaceId: space.id
          })
        )
      );
      refreshRoles();
    }
  }

  async function unassignRole(roleId: string, userId: string) {
    if (space) {
      await charmClient.roles.unassignRole({
        roleId,
        userId,
        spaceId: space.id
      });
      refreshRoles();
    }
  }

  function refreshRoles() {
    if (space) {
      mutate(`roles/${space.id}`);
    }
  }

  return {
    createRole,
    updateRole,
    deleteRole,
    assignRoles,
    unassignRole,
    refreshRoles,
    roles
  };
}
