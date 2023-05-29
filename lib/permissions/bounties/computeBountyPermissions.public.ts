import type { Bounty, BountyPermission } from '@charmverse/core/prisma-client';

import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

import { AvailableBountyPermissions } from './availableBountyPermissions';
import type { BountyPermissionFlags } from './interfaces';
import { bountyPermissionMapping } from './mapping';

export async function computeBountyPermissionsPublic({
  userId,
  bounty
}: {
  userId: string;
  bounty: Pick<Bounty, 'createdBy' | 'spaceId'> & { permissions: BountyPermission[] };
}): Promise<BountyPermissionFlags> {
  const { spaceRole } = await hasAccessToSpace({
    spaceId: bounty.spaceId,
    userId
  });

  const allowedOperations = new AvailableBountyPermissions();

  if (!spaceRole) {
    return allowedOperations.empty;
  }

  if (spaceRole?.isAdmin) {
    if (
      bounty.createdBy === userId ||
      bounty.permissions.some((p) => p.permissionLevel === 'creator' && p.userId === userId)
    ) {
      return { ...allowedOperations.full, work: false };
    }
    return allowedOperations.full;
  }

  // Creator-level permission is mutually exclusive with any other type of permissions
  if (
    bounty.createdBy === userId ||
    bounty.permissions.some((p) => p.permissionLevel === 'creator' && p.userId === userId)
  ) {
    allowedOperations.addPermissions(bountyPermissionMapping.creator.slice());
    return allowedOperations.operationFlags;
  }

  // Add reviewer permissions
  if (bounty.permissions.some((p) => p.permissionLevel === 'reviewer' && p.userId === userId)) {
    allowedOperations.addPermissions(bountyPermissionMapping.reviewer.slice());
  }

  // Always allow space members to submit work to the bounty
  allowedOperations.addPermissions(bountyPermissionMapping.submitter.slice());

  return allowedOperations.operationFlags;
}
