import { prisma } from '@charmverse/core/prisma-client';
import { PageNotFoundError } from '@packages/core/errors';
import type {
  PagePermissionFlags,
  PermissionCompute,
  PreComputedSpaceRole,
  PreFetchedResource
} from '@packages/core/permissions';
import {
  AvailablePagePermissions,
  buildComputePermissionsWithPermissionFilteringPolicies,
  hasAccessToSpace
} from '@packages/core/permissions';

import type { ProposalResource } from 'lib/proposalPermissions/proposalResolver';

import type { PageResource } from '../policies';
import { pageResourceSelect, pageResolver, defaultPagePolicies } from '../policies';

import { computePagePermissionsUsingProposalPermissionsForFreeSpace } from './computePagePermissionsUsingProposalPermissionsForFreeSpace';
import { policyOnlyEditableByBountyCreator } from './policies/policyOnlyEditableByBountyCreator';

type ComputeParams = PermissionCompute &
  PreFetchedResource<PageResource> &
  PreComputedSpaceRole & { preFetchedProposalResource?: ProposalResource };

export async function baseComputePagePermissionsForFreeSpace({
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
    return computePagePermissionsUsingProposalPermissionsForFreeSpace({
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

  const permissions = new AvailablePagePermissions({ isReadonlySpace: false });

  if (isAdmin || spaceRole) {
    permissions.addPermissions([
      'comment',
      'create_poll',
      'delete',
      'edit_content',
      'edit_path',
      'edit_position',
      'read',
      'edit_lock'
    ]);
  } else {
    permissions.addPermissions(['read']);
  }

  return permissions.operationFlags;
}

export const computePagePermissionsForFreeSpace = buildComputePermissionsWithPermissionFilteringPolicies<
  PageResource,
  PagePermissionFlags,
  ComputeParams
>({
  resolver: pageResolver,
  computeFn: baseComputePagePermissionsForFreeSpace,
  policies: [...defaultPagePolicies, policyOnlyEditableByBountyCreator]
});
