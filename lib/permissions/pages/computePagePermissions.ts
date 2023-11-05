import { PageNotFoundError } from '@charmverse/core/errors';
import type {
  PagePermissionFlags,
  PageResource,
  PermissionCompute,
  PreComputedSpaceRole,
  PreFetchedResource,
  ProposalResource
} from '@charmverse/core/permissions';
import {
  AvailablePagePermissions,
  buildComputePermissionsWithPermissionFilteringPolicies,
  defaultPagePolicies,
  hasAccessToSpace,
  pageResolver,
  pageResourceSelect
} from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';

import { computePagePermissionsUsingProposalPermissions } from './computePagePermissionsUsingProposalPermissions';
import { policyOnlyEditableByBountyCreator } from './policies/policyOnlyEditableByBountyCreator';

type ComputeParams = PermissionCompute &
  PreFetchedResource<PageResource> &
  PreComputedSpaceRole & { preFetchedProposalResource?: ProposalResource };

export async function baseComputePagePermissions({
  resourceId,
  userId,
  preFetchedResource,
  preComputedSpaceRole,
  preFetchedProposalResource
}: ComputeParams): Promise<PagePermissionFlags> {
  const pageInDb =
    preFetchedResource ??
    (await prisma.page.findUnique({
      where: { id: resourceId },
      select: pageResourceSelect()
    }));

  const pageId = resourceId;

  if (!pageInDb) {
    throw new PageNotFoundError(`${resourceId}`);
  }

  if (pageInDb.proposalId) {
    return computePagePermissionsUsingProposalPermissions({
      resourceId: pageId,
      userId,
      preComputedSpaceRole,
      preFetchedResource: preFetchedProposalResource
    });
  }

  const { isAdmin, spaceRole } = await hasAccessToSpace({
    spaceId: pageInDb.spaceId,
    userId,
    preComputedSpaceRole
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
  PagePermissionFlags,
  ComputeParams
>({
  resolver: pageResolver,
  computeFn: baseComputePagePermissions,
  policies: [...defaultPagePolicies, policyOnlyEditableByBountyCreator]
});
