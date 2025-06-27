import { InvalidPermissionGranteeError } from '../../errors';
import type { TargetPermissionGroup } from '../core/interfaces';

export function getPermissionAssignee(
  permission: Partial<{ roleId: string | null; userId: string | null; spaceId: string | null; public: boolean | null }>
): TargetPermissionGroup {
  // Make sure we always have a single assignee
  if (permission.public && !permission.roleId && !permission.spaceId && !permission.userId) {
    return {
      group: 'public'
    };
  } else if (permission.roleId && !permission.spaceId && !permission.userId) {
    return {
      group: 'role',
      id: permission.roleId
    };
  } else if (permission.spaceId && !permission.userId) {
    return {
      group: 'space',
      id: permission.spaceId
    };
  } else if (permission.userId) {
    return {
      group: 'user',
      id: permission.userId
    };
  }
  throw new InvalidPermissionGranteeError();
}
