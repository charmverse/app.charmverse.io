import { prisma } from '@charmverse/core/prisma-client';

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

  const { spaceRole, isAdmin } = await hasAccessToSpace({
    userId,
    spaceId: resourceId
  });

  if (!spaceRole) {
    // Returns all permissions as false since user is not space member
    return allowedOperations.empty;
  }

  if (isAdmin) {
    return allowedOperations.full;
  }

  allowedOperations.addPermissions(['createBounty', 'createPage', 'reviewProposals']);

  return allowedOperations.operationFlags;
}
