import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

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

  const { spaceRole } = await hasAccessToSpace({
    userId,
    spaceId: resourceId
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
