import { prisma } from 'db';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

import { filterApplicablePermissions } from '../filterApplicablePermissions';
import type { PermissionCompute } from '../interfaces';

import { AvailableSpacePermissions } from './availableSpacePermissions';
import type { SpacePermissionFlags } from './interfaces';

export async function computeSpacePermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<SpacePermissionFlags> {
  const allowedOperations = new AvailableSpacePermissions();

  if (!userId) {
    return allowedOperations.empty;
  }

  const { error, isAdmin } = await hasAccessToSpace({
    userId,
    spaceId: resourceId,
    adminOnly: false,
    disallowGuest: true
  });

  if (error) {
    // Returns all permissions as false since user is not space member
    return allowedOperations.empty;
  }

  if (isAdmin) {
    return allowedOperations.full;
  }

  // Rollup space permissions
  const spacePermissions = await prisma.spacePermission.findMany({
    where: {
      forSpaceId: resourceId
    }
  });

  const applicablePermissions = await filterApplicablePermissions({
    permissions: spacePermissions,
    resourceSpaceId: resourceId,
    userId
  });

  applicablePermissions.forEach((permission) => {
    allowedOperations.addPermissions(permission.operations);
  });
  return allowedOperations.operationFlags;
}
