import type { PagePermission } from '@charmverse/core/prisma';
import type { PagePermissionAssignmentByValues } from '@packages/core/permissions';
/**
 * Given a list of permissions and a permission, find a permission in the list that targets that group
 * @ignorePermissionLevel - Return permission for target group even if it has different permission level
 */
export function findExistingPermissionForGroup(
  basePermission: PagePermissionAssignmentByValues,
  permissionList: PagePermission[],
  ignorePermissionLevel = false
): PagePermission | null {
  const foundPermission = permissionList.find((permission) => {
    if (basePermission.permissionLevel !== permission.permissionLevel && !ignorePermissionLevel) {
      return false;
    }

    if (basePermission.assignee.group === 'user') {
      return basePermission.assignee.id === permission.userId;
    }

    if (basePermission.assignee.group === 'role') {
      return basePermission.assignee.id === permission.roleId;
    }

    if (basePermission.assignee.group === 'space') {
      return basePermission.assignee.id === permission.spaceId;
    }

    if (basePermission.assignee.group === 'public') {
      return permission.public === true;
    }

    return false;
  });

  if (foundPermission) {
    return foundPermission;
  }

  return null;
}
