import { PageNotFoundError } from '@charmverse/core/errors';
import type { PagePermissionFlags, PageResource, PermissionCompute } from '@charmverse/core/permissions';
import {
  defaultPagePolicies,
  pageResolver,
  AvailablePagePermissions,
  buildComputePermissionsWithPermissionFilteringPolicies,
  hasAccessToSpace
} from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';

import { computePagePermissionsUsingProposalPermissions } from './computePagePermissionsUsingProposalPermissions';
import { policyOnlyEditableByBountyCreator } from './policies/policyOnlyEditableByBountyCreator';

export async function baseComputePagePermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<PagePermissionFlags> {
  const pageInDb = await prisma.page.findUnique({
    where: { id: resourceId },
    select: {
      id: true,
      spaceId: true,
      proposalId: true,
      convertedProposalId: true
    }
  });

  const pageId = resourceId;

  if (!pageInDb) {
    throw new PageNotFoundError(`${resourceId}`);
  }

  if (pageInDb.proposalId) {
    return computePagePermissionsUsingProposalPermissions({
      resourceId: pageId,
      userId
    });
  }

  const { isAdmin, spaceRole } = await hasAccessToSpace({
    spaceId: pageInDb.spaceId,
    userId
  });

  const permissions = new AvailablePagePermissions();

  if (isAdmin || spaceRole) {
    permissions.addPermissions([
      'comment',
      'create_poll',
      'delete',
      'edit_content',
      'edit_path',
      'edit_position',
      'read'
    ]);
  } else {
    permissions.addPermissions(['read']);
  }

  return permissions.operationFlags;
}

export const computePagePermissions = buildComputePermissionsWithPermissionFilteringPolicies<
  PageResource,
  PagePermissionFlags
>({
  resolver: pageResolver,
  computeFn: baseComputePagePermissions,
  policies: [...defaultPagePolicies, policyOnlyEditableByBountyCreator]
});
