import { computeProposalPermissions } from 'lib/permissions/proposals/computeProposalPermissions';

import type { PermissionCompute } from '../interfaces';

import { AllowedPagePermissions } from './available-page-permissions.class';
import type { IPagePermissionFlags } from './page-permission-interfaces';

/**
 * @resourceId - The id of the proposal (usually the same as page id)
 */
export async function computePagePermissionsUsingProposalPermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<IPagePermissionFlags> {
  const proposalPermissions = await computeProposalPermissions({
    resourceId,
    userId
  });

  const permissions = new AllowedPagePermissions();

  if (proposalPermissions.view) {
    permissions.addPermissions(['read']);
  }

  if (proposalPermissions.comment) {
    permissions.addPermissions(['comment']);
  }

  if (proposalPermissions.edit) {
    permissions.addPermissions(['edit_content', 'edit_isPublic', 'edit_position']);
  }

  if (proposalPermissions.delete) {
    permissions.addPermissions(['delete']);
  }

  return permissions.operationFlags;
}
