import { AvailablePagePermissions } from '@charmverse/core/permissions';
import type {
  PagePermissionFlags,
  PermissionCompute,
  PreFetchedResource,
  ProposalResource,
  PreComputedSpaceRole
} from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';

import { computeProposalPermissions } from 'lib/permissions/proposals/computeProposalPermissions';

type ComputeParams = PermissionCompute & PreFetchedResource<ProposalResource> & PreComputedSpaceRole;

/**
 * @resourceId - The id of the proposal (usually the same as page id)
 */
export async function computePagePermissionsUsingProposalPermissions({
  resourceId,
  userId,
  preFetchedResource,
  preComputedSpaceRole
}: ComputeParams): Promise<PagePermissionFlags> {
  const proposalPermissions = await computeProposalPermissions({
    resourceId,
    userId,
    preFetchedResource,
    preComputedSpaceRole
  });

  const permissions = new AvailablePagePermissions();

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
    permissions.addPermissions(['edit_isPublic']);
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
