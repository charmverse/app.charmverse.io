import type { PagePermissionFlags } from '@charmverse/core';
import { AvailablePagePermissions } from '@charmverse/core';
import { prisma } from '@charmverse/core/prisma-client';

import type { PermissionCompute } from '../interfaces';
import { computeProposalPermissions } from '../proposals/computeProposalPermissions';

/**
 * @resourceId - The id of the proposal (usually the same as page id)
 */
export async function computePagePermissionsUsingProposalPermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<PagePermissionFlags> {
  const proposalPermissions = await computeProposalPermissions({
    resourceId,
    userId
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
