import type { ProposalCategoryPermission } from '@prisma/client';

import { InvalidPermissionGranteeError } from './errors';
import type { AssignablePermissionGroups, TargetPermissionGroup } from './interfaces';

export function permissionGroupIsValid(group: AssignablePermissionGroups): boolean {
  if (group !== 'role' && group !== 'space' && group !== 'user') {
    return false;
  }

  return true;
}
export function getPermissionAssignee(
  permission: Pick<ProposalCategoryPermission, 'public' | 'roleId' | 'spaceId'>
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
