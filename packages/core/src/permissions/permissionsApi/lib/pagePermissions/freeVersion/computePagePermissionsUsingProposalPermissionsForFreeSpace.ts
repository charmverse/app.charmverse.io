import { prisma } from '@charmverse/core/prisma-client';
import type {
  PagePermissionFlags,
  PermissionCompute,
  PreComputedSpaceRole,
  PreFetchedResource
} from '@packages/core/permissions';
import { AvailablePagePermissions } from '@packages/core/permissions';

import { computeProposalEvaluationPermissionsForFreeSpace } from '../../proposalPermissions/freeVersion/computeProposalEvaluationPermissionsForFreeSpace';
import type { ProposalResource } from '../../proposalPermissions/proposalResolver';

type ComputeParams = PermissionCompute & PreFetchedResource<ProposalResource> & PreComputedSpaceRole;

/**
 * @resourceId - The id of the proposal (usually the same as page id)
 */
export async function computePagePermissionsUsingProposalPermissionsForFreeSpace({
  resourceId,
  userId,
  preFetchedResource,
  preComputedSpaceRole
}: ComputeParams): Promise<PagePermissionFlags> {
  const proposalPermissions = await computeProposalEvaluationPermissionsForFreeSpace({
    resourceId,
    userId,
    preFetchedResource,
    preComputedSpaceRole
  });

  const permissions = new AvailablePagePermissions({ isReadonlySpace: false });

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

  if (!permissions.operationFlags.read) {
    const publicPermission = await prisma.pagePermission.findFirst({
      where: {
        pageId: resourceId,
        public: true
      }
    });

    if (publicPermission) {
      permissions.addPermissions(['read']);
    }
  }

  return permissions.operationFlags;
}
