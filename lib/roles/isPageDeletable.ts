import { PagePermission } from '@prisma/client';
import { ListSpaceRolesResponse } from 'charmClient';
import { LoggedInUser } from 'models/User';

export function isPageDeletable (userId?: string, spaceId?: string, permissions?: PagePermission[], spaceRoles?: LoggedInUser['spaceRoles'], roles?: ListSpaceRolesResponse[]) {
  const isAdminOfSpace = spaceRoles?.find(spaceRole => spaceRole.spaceId === spaceId && spaceRole.isAdmin);
  let canDelete = !!isAdminOfSpace;
  const rolesOfUser: string[] = [];
  if (roles) {
    for (const role of roles) {
      for (const spaceRoleToRole of role.spaceRolesToRole) {
        if (spaceRoleToRole.spaceRole.user.id === userId) {
          rolesOfUser.push(role.id);
          break;
        }
      }
    }
  }

  if (!isAdminOfSpace && userId && spaceId && permissions) {
    for (const permission of (permissions as PagePermission[])) {
      // For individual user id
      if (permission.userId === userId && permission.permissionLevel.match(/(editor|full_access)/)) {
        canDelete = true;
        break;
      }

      if (permission.spaceId === spaceId && permission.permissionLevel.match(/(editor|full_access)/)) {
        canDelete = true;
        break;
      }

      if (permission.roleId && rolesOfUser.includes(permission.roleId) && permission.permissionLevel.match(/(editor|full_access)/)) {
        canDelete = true;
        break;
      }
    }
  }
  return canDelete;
}
