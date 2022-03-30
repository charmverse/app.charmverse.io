import { Role } from '@prisma/client';
import charmClient, { ListSpaceRolesResponse } from 'charmClient';
import { useState } from 'react';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

export default function useRoles () {
  const [space] = useCurrentSpace();
  const [roles, setRoles] = useState<ListSpaceRolesResponse[]>([]);

  async function listRoles (): Promise<ListSpaceRolesResponse []> {
    if (space) {
      const rolesInSpace = await charmClient.listRoles(space.id);
      setRoles(rolesInSpace);
      return rolesInSpace;
    }
    else {
      return [];
    }
  }

  async function createRole (role: Partial<Role>): Promise<Role> {
    role.spaceId = space?.id;
    const createdRole = await charmClient.createRole(role);
    setRoles([...roles, {
      ...createdRole,
      // Initially no user is attached to a role, so its safe to keep it empty
      spaceRolesToRole: []
    }]);
    return createdRole;
  }

  async function updateRole (role: Partial<Role>): Promise<Role> {
    role.spaceId = space?.id;
    const updatedRole = await charmClient.updateRole(role);
    setRoles([...roles, {
      ...updatedRole,
      // Initially no user is attached to a role, so its safe to keep it empty
      spaceRolesToRole: []
    }]);
    return updatedRole;
  }

  async function deleteRole (roleId: string) {
    await charmClient.deleteRole({ roleId, spaceId: space!.id });
    setRoles(roles.filter(role => role.id !== roleId));
  }

  async function assignRoles (roleId: string, userIds: string[]) {
    if (space) {
      await Promise.all(userIds.map(userId => charmClient.assignRole({
        roleId,
        userId,
        spaceId: space.id
      })));
      // TODO: Remove this listRoles and add required data directly to state
      listRoles();
    }
  }

  async function unassignRole (roleId: string, userId: string) {
    if (space) {
      await charmClient.unassignRole({
        roleId,
        userId,
        spaceId: space.id
      });
      listRoles();
    }
  }

  return {
    listRoles,
    createRole,
    updateRole,
    deleteRole,
    assignRoles,
    unassignRole,
    roles
  };
}
