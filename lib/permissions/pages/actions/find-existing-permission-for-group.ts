import { PagePermission } from '@prisma/client';
import { IPagePermissionToCreate } from '../page-permission-interfaces';

/**
 * Given a list of permissions and a permission, find a permission in the list that targets that group
 */
export function findExistingPermissionForGroup (basePermission: IPagePermissionToCreate, permissionList: PagePermission []): PagePermission | null {
  const foundPermission = permissionList.find(permission => {

    if (basePermission.permissionLevel !== permission.permissionLevel) {
      return false;
    }

    if (basePermission.userId) {
      return basePermission.userId === permission.userId;
    }

    if (basePermission.roleId) {
      return basePermission.roleId === permission.roleId;
    }

    if (basePermission.spaceId) {
      return basePermission.spaceId === permission.spaceId;
    }

    return false;

  });

  if (foundPermission) {
    return foundPermission;
  }

  return null;
}
