import type { PagePermission } from '@prisma/client';

import type { IPagePermissionToCreate } from '../page-permission-interfaces';

/**
 * Given a list of permissions and a permission, find a permission in the list that targets that group
 * @ignorePermissionLevel - Return permission for target group even if it has different permission level
 */
export function findExistingPermissionForGroup (
  basePermission: IPagePermissionToCreate,
  permissionList: PagePermission [],
  ignorePermissionLevel = false
):
PagePermission | null {
  const foundPermission = permissionList.find(permission => {

    if (basePermission.permissionLevel !== permission.permissionLevel && !ignorePermissionLevel) {
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

    if (basePermission.public === true) {
      return permission.public === true;
    }

    return false;

  });

  if (foundPermission) {
    return foundPermission;
  }

  return null;
}
