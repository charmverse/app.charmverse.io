import type { Role } from '@charmverse/core/dist/prisma';
import useSWR, { mutate } from 'swr';

import charmClient from 'charmClient';
import type { CreateRoleInput } from 'components/settings/roles/components/CreateRoleForm';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';

export function useRoles() {
  const space = useCurrentSpace();
  const { mutateMembers } = useMembers();

  const { data: roles } = useSWR(
    () => (space ? `roles/${space.id}` : null),
    () => (space ? charmClient.roles.listRoles(space.id) : null)
  );

  async function createRole(role: CreateRoleInput): Promise<Role> {
    if (!space) {
      throw new Error('Cannot create role without a space');
    }
    const createdRole = await charmClient.roles.createRole({
      spaceId: space.id,
      ...role
    });
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
      mutateMembers();
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
      mutateMembers();
    }
  }

  async function refreshRoles() {
    if (space) {
      return mutate(`roles/${space.id}`);
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
