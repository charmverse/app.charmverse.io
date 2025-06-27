import type { PermissionCompute, PreComputedSpaceRole, SpacePermissionFlags } from '@packages/core/permissions';
import { hasAccessToSpace, AvailableSpacePermissions } from '@packages/core/permissions';

type ComputeParams = PermissionCompute & PreComputedSpaceRole;

export async function computeSpacePermissionsForFreeSpace({
  resourceId,
  userId,
  preComputedSpaceRole
}: ComputeParams): Promise<SpacePermissionFlags> {
  const { spaceRole, isReadonlySpace } = await hasAccessToSpace({
    userId,
    spaceId: resourceId,
    preComputedSpaceRole
  });
  const allowedOperations = new AvailableSpacePermissions({ isReadonlySpace });

  if (!userId) {
    return allowedOperations.empty;
  }

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
      deleteAnyProposal: false,
      createProposals: true
    };
  }
}
