import type { Role } from '@charmverse/core/prisma';
import useSWR, { mutate } from 'swr';

import charmClient from 'charmClient';
import type { CreateRoleInput } from 'components/settings/roles/components/CreateRoleForm';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';

export function useRoles({ includeArchived = false }: { includeArchived?: boolean } = {}) {
  const { space } = useCurrentSpace();
  const { mutateMembers } = useMembers();

  const { data: roles } = useSWR(space ? `roles/${space.id}?includeArchived=${includeArchived}` : null, () =>
    space ? charmClient.roles.listRoles(space.id, includeArchived) : null
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
    return mutate((key) => typeof key === 'string' && key.startsWith(`roles/${space?.id || ''}`));
  }

  async function archiveRole(roleId: string) {
    await charmClient.roles.archiveRole(roleId);
    refreshRoles();
  }

  async function unarchiveRole(roleId: string) {
    await charmClient.roles.unarchiveRole(roleId);
    refreshRoles();
  }

  return {
    createRole,
    updateRole,
    deleteRole,
    assignRoles,
    unassignRole,
    refreshRoles,
    archiveRole,
    unarchiveRole,
    roles
  };
}
