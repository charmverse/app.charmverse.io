import type { BountyPermission } from '@prisma/client';

import type { TargetPermissionGroup } from '../interfaces';

import type { BountyPermissions } from './interfaces';

export function mapBountyPermissions (bountyPermissions: BountyPermission[]): BountyPermissions {
  const mapping: BountyPermissions = {
    creator: [],
    reviewer: [],
    submitter: []
  };

  for (const permission of bountyPermissions) {
    const targetGroup: TargetPermissionGroup | null = permission.public === true ? {
      group: 'public',
      id: undefined
    } : permission.userId ? {
      group: 'user',
      id: permission.userId
    } : permission.roleId ? {
      group: 'role',
      id: permission.roleId
    } : permission.spaceId ? {
      group: 'space',
      id: permission.spaceId
    } : null;

    if (targetGroup) {
      mapping[permission.permissionLevel].push(targetGroup);
    }
  }

  return mapping;

}
