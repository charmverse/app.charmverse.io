import type { PreComputedSpaceRole } from '@charmverse/core/permissions';
import { hasAccessToSpace } from '@charmverse/core/permissions';

import type { PermissionCompute } from '../interfaces';

import { AvailableSpacePermissions } from './availableSpacePermissions';
import type { SpacePermissionFlags } from './interfaces';

type ComputeParams = PermissionCompute & PreComputedSpaceRole;

export async function computeSpacePermissions({
  resourceId,
  userId,
  preComputedSpaceRole
}: ComputeParams): Promise<SpacePermissionFlags> {
  const allowedOperations = new AvailableSpacePermissions();

  if (!userId) {
    return allowedOperations.empty;
  }

  const { spaceRole } = await hasAccessToSpace({
    userId,
    spaceId: resourceId,
    preComputedSpaceRole
  });

  if (!spaceRole) {
    // Returns all permissions as false since user is not space member
    return allowedOperations.empty;

    // Provide full permissions to all space members independent of admin status
  } else if (spaceRole.isAdmin) {
    return allowedOperations.full;
  } else {
    return {
      createBounty: true,
      createForumCategory: true,
      createPage: true,
      moderateForums: true,
      reviewProposals: true,
      deleteAnyBounty: false,
      deleteAnyPage: false,
      deleteAnyProposal: false
    };
  }
}
