import { prisma } from '@charmverse/core/prisma-client';
import type {
  PermissionCompute,
  PreComputedSpaceRole,
  PreFetchedUserRoleMemberships,
  SpacePermissionFlags
} from '@packages/core/permissions';
import { AvailableSpacePermissions, hasAccessToSpace } from '@packages/core/permissions';

import { filterApplicablePermissions } from '../corePermissions';

export async function computeSpacePermissions({
  resourceId,
  userId,
  preComputedSpaceRole,
  preFetchedUserRoleMemberships
}: PermissionCompute & PreComputedSpaceRole & PreFetchedUserRoleMemberships): Promise<SpacePermissionFlags> {
  const { spaceRole, isReadonlySpace } = await hasAccessToSpace({
    userId,
    spaceId: resourceId,
    preComputedSpaceRole
  });

  const allowedOperations = new AvailableSpacePermissions({ isReadonlySpace });

  if (!userId) {
    return allowedOperations.empty;
  }

  if (!spaceRole || spaceRole.isGuest) {
    // Returns all permissions as false since user is not space member
    return allowedOperations.empty;
  }

  if (spaceRole.isAdmin) {
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
    userId,
    preComputedSpaceRole: spaceRole,
    preFetchedUserRoleMemberships
  });

  applicablePermissions.forEach((permission) => {
    allowedOperations.addPermissions(permission.operations);
  });
  return allowedOperations.operationFlags;
}
