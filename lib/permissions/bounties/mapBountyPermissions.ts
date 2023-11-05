import type { BountyPermission } from '@charmverse/core/prisma';

import type { TargetPermissionGroup } from '../interfaces';

import type { BountyPermissions } from './interfaces';

export function mapBountyPermissions(bountyPermissions: BountyPermission[]): BountyPermissions {
  const mapping: BountyPermissions = {
    creator: [],
    reviewer: [],
    submitter: []
  };

  for (const permission of bountyPermissions) {
    const targetGroup: TargetPermissionGroup | null =
      permission.public === true
        ? {
            group: 'public'
          }
        : permission.userId
        ? {
            group: 'user',
            id: permission.userId
          }
        : permission.roleId
        ? {
            group: 'role',
            id: permission.roleId
          }
        : permission.spaceId
        ? {
            group: 'space',
            id: permission.spaceId
          }
        : null;

    if (targetGroup) {
      // TODO: better separation between permission levels and groups
      mapping[permission.permissionLevel].push(targetGroup as { id: string; group: 'role' });
    }
  }

  return mapping;
}
