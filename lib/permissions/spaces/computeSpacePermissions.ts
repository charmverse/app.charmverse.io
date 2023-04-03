import { prisma } from 'db';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

import type { PermissionComputeRequest } from '../interfaces';

import { AvailableSpacePermissions } from './availableSpacePermissions';
import type { SpacePermissionFlags } from './interfaces';

export async function computeSpacePermissions({
  allowAdminBypass,
  resourceId,
  userId
}: PermissionComputeRequest): Promise<SpacePermissionFlags> {
  const allowedOperations = new AvailableSpacePermissions();

  if (!userId) {
    return allowedOperations.empty;
  }

  const { error, isAdmin } = await hasAccessToSpace({
    userId,
    spaceId: resourceId,
    adminOnly: false
  });

  if (error) {
    // Returns all permissions as false since user is not space member
    return allowedOperations.empty;
  }

  if (isAdmin && allowAdminBypass) {
    return allowedOperations.full;
  }

  // Rollup space permissions
  const spacePermissions = await prisma.spacePermission.findMany({
    where: {
      forSpaceId: resourceId
    }
  });

  for (const permissionSet of spacePermissions) {
    allowedOperations.addPermissions(permissionSet.operations);
  }

  return allowedOperations.operationFlags;
}
