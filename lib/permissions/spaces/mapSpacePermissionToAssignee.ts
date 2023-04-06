import type { SpacePermission } from '@prisma/client';

import log from 'lib/log';

import type { TargetPermissionGroup } from '../interfaces';

import type { SpacePermissionFlags } from './interfaces';

export type AssignedSpacePermission = {
  assignee: TargetPermissionGroup<'role' | 'space'>;
  permissions: SpacePermissionFlags;
};

export function mapSpacePermissionToAssignee(spacePermission: SpacePermission): AssignedSpacePermission {
  return {
    permissions: spacePermission.permissionLevel,
    assignee: getPermissionAssignee(spacePermission)
  };
}

export function getPermissionAssignee(permission: SpacePermission): AssignedSpacePermission['assignee'] {
  if (permission.roleId && !permission.spaceId) {
    return {
      group: 'role',
      id: permission.roleId
    };
  } else if (permission.spaceId) {
    return {
      group: 'space',
      id: permission.spaceId
    };
  } else {
    log.error('Invalid permission assignee', permission);
  }
}
