import type { PagePermission } from '@charmverse/core/prisma-client';
import type { PagePermissionFlags, PermissionComputeWithCachedData } from '@packages/core/permissions';
import { AvailablePagePermissions } from '@packages/core/permissions';

import { computeProposalEvaluationPermissions } from '../proposalPermissions/computeProposalEvaluationPermissions';
import type { ProposalResource } from '../proposalPermissions/proposalResolver';

/**
 * @resourceId - The id of the proposal (usually the same as page id)
 */
export async function computePagePermissionsUsingProposalPermissions({
  resourceId,
  userId,
  preComputedSpaceRole,
  preFetchedResource,
  preFetchedPermissions,
  preComputedSpacePermissionFlags,
  preFetchedUserRoleMemberships,
  isReadonlySpace
}: PermissionComputeWithCachedData<ProposalResource, PagePermission> & {
  isReadonlySpace?: boolean;
}): Promise<PagePermissionFlags> {
  const proposalPermissions = await computeProposalEvaluationPermissions({
    resourceId,
    userId,
    preComputedSpacePermissionFlags,
    preComputedSpaceRole,
    preFetchedResource,
    preFetchedUserRoleMemberships,
    preFetchedPermissions
  });

  const permissions = new AvailablePagePermissions({ isReadonlySpace: isReadonlySpace ?? false });

  if (proposalPermissions.view) {
    permissions.addPermissions(['read']);
  }

  if (proposalPermissions.comment) {
    permissions.addPermissions(['comment']);
  }

  if (proposalPermissions.edit) {
    permissions.addPermissions(['edit_content', 'edit_position']);
  }

  if (proposalPermissions.make_public) {
    permissions.addPermissions(['grant_permissions']);
  }

  if (proposalPermissions.delete) {
    permissions.addPermissions(['delete']);
  }

  // map permission name - page uses create_poll, proposal uses create_vote
  if (proposalPermissions.create_vote) {
    permissions.addPermissions(['create_poll']);
  }

  return permissions.operationFlags;
}
