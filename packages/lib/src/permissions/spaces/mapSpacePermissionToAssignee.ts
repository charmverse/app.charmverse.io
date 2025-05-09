import type { SpacePermission } from '@charmverse/core/prisma';

import { InvalidPermissionGranteeError } from '../errors';
import type { TargetPermissionGroup } from '../interfaces';

import { AvailableSpacePermissions } from './availableSpacePermissions';
import type { SpacePermissionFlags } from './interfaces';

export type AssignedSpacePermission = {
  assignee: TargetPermissionGroup<'role' | 'space'>;
  operations: SpacePermissionFlags;
};

export function mapSpacePermissionToAssignee(spacePermission: SpacePermission): AssignedSpacePermission {
  const permissions = new AvailableSpacePermissions();
  permissions.addPermissions(spacePermission.operations);
  return {
    assignee: getPermissionAssignee(spacePermission),
    operations: permissions.operationFlags
  };
}

function getPermissionAssignee(permission: SpacePermission): AssignedSpacePermission['assignee'] {
  if (permission.roleId) {
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
    throw new InvalidPermissionGranteeError();
  }
}
