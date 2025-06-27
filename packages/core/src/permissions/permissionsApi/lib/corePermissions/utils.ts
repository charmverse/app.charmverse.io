import type { PagePermission, PostCategoryPermission } from '@charmverse/core/prisma';
import type { AssignablePermissionGroups, TargetPermissionGroup } from '@packages/core/permissions';

import { InvalidPermissionGranteeError } from './errors';

export function permissionGroupIsValid(group: AssignablePermissionGroups): boolean {
  if (group !== 'role' && group !== 'space' && group !== 'user') {
    return false;
  }

  return true;
}
export function getPermissionAssignee(
  permission: Pick<PostCategoryPermission | PagePermission, 'public' | 'roleId' | 'spaceId'>
): TargetPermissionGroup<'public' | 'role' | 'space'> {
  // Make sure we always have a single assignee
  if (permission.public && !permission.roleId && !permission.spaceId) {
    return {
      group: 'public'
    };
  } else if (permission.roleId && !permission.spaceId) {
    return {
      group: 'role',
      id: permission.roleId
    };
  } else if (permission.spaceId) {
    return {
      group: 'space',
      id: permission.spaceId
    };
  }
  throw new InvalidPermissionGranteeError();
}
