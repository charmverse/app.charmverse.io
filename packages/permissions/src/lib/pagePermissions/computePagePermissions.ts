import type { Prisma } from '@charmverse/core/prisma';
import type { PagePermission } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { PageNotFoundError } from '@packages/core/errors';
import type { PagePermissionFlags, PermissionComputeWithCachedData } from '@packages/core/permissions';
import {
  AvailablePagePermissions,
  buildComputePermissionsWithPermissionFilteringPolicies,
  hasAccessToSpace
} from '@packages/core/permissions';

import { filterApplicablePermissions } from 'lib/corePermissions/filterApplicablePermissions';
import type { ProposalResource } from 'lib/proposalPermissions/proposalResolver';
import { computeSpacePermissions } from 'lib/spacePermissions/computeSpacePermissions';

import { computeProposalNotePermissions } from '../proposalPermissions/computeProposalNotePermissions';

import { computePagePermissionsUsingProposalPermissions } from './computePagePermissionsUsingProposalPermissions';
import { permissionTemplates } from './mapping';
import type { PageResource } from './policies';
import { defaultPagePolicies, pageResolver } from './policies';

type ComputeParams = PermissionComputeWithCachedData<PageResource, PagePermission> & {
  preFetchedProposalResource?: ProposalResource;
};

export async function baseComputePagePermissions({
  resourceId,
  userId,
  preComputedSpaceRole,
  preComputedSpacePermissionFlags,
  preFetchedResource,
  preFetchedPermissions,
  preFetchedUserRoleMemberships,
  preFetchedProposalResource
}: ComputeParams): Promise<PagePermissionFlags> {
  const pageInDb = preFetchedResource ?? (await pageResolver({ resourceId }));

  const pageId = resourceId;

  if (!pageInDb) {
    throw new PageNotFoundError(`${resourceId}`);
  }

  const { spaceRole, isReadonlySpace } = await hasAccessToSpace({
    spaceId: pageInDb.spaceId,
    userId,
    preComputedSpaceRole
  });

  if (pageInDb.type === 'proposal_template') {
    if (spaceRole?.isAdmin) {
      return new AvailablePagePermissions({ isReadonlySpace }).full;
    } else if (spaceRole) {
      return new AvailablePagePermissions({ isReadonlySpace }).addPermissions(['read']).operationFlags;
    } else {
      const space = await prisma.space.findUniqueOrThrow({
        where: {
          id: pageInDb.spaceId
        },
        select: {
          publicProposalTemplates: true
        }
      });

      if (space.publicProposalTemplates) {
        return new AvailablePagePermissions({ isReadonlySpace }).addPermissions(['read']).operationFlags;
      } else {
        return new AvailablePagePermissions({ isReadonlySpace }).empty;
      }
    }
  }

  if (pageInDb.type === 'proposal_notes') {
    return computeProposalNotePermissions({
      resourceId: pageId,
      userId,
      preComputedSpaceRole: spaceRole,
      preFetchedResource: pageInDb,
      preFetchedUserRoleMemberships,
      isReadonlySpace
    });
  }

  if (pageInDb.proposalId) {
    return computePagePermissionsUsingProposalPermissions({
      resourceId: pageId,
      userId,
      preComputedSpaceRole: spaceRole,
      preComputedSpacePermissionFlags,
      preFetchedPermissions,
      preFetchedResource: preFetchedProposalResource,
      preFetchedUserRoleMemberships,
      isReadonlySpace
    });
  }

  if (spaceRole?.isAdmin) {
    return new AvailablePagePermissions({ isReadonlySpace }).full;
  }
  const whereQuery: Prisma.PagePermissionWhereInput = !spaceRole
    ? {
        public: true
      }
    : spaceRole.isGuest
      ? {
          OR: [
            {
              public: true
            },
            {
              // Only get individual user permissions if they are a guest
              userId
            }
          ]
        }
      : // Don't add any extra filters for default members, load all permissions
        {};

  const pagePermissions =
    preFetchedPermissions ??
    (await prisma.pagePermission.findMany({
      where: {
        pageId,
        ...whereQuery
      }
    }));
  const applicablePermissions = await filterApplicablePermissions({
    permissions: pagePermissions,
    resourceSpaceId: pageInDb.spaceId,
    userId,
    preComputedSpaceRole: spaceRole,
    preFetchedUserRoleMemberships
  });

  const computedPermissions = new AvailablePagePermissions({ isReadonlySpace });

  applicablePermissions.forEach((permission) => {
    computedPermissions.addPermissions(
      permission.permissionLevel === 'custom' ? permission.permissions : permissionTemplates[permission.permissionLevel]
    );
  });

  const spacePermissions =
    preComputedSpacePermissionFlags ??
    (await computeSpacePermissions({
      resourceId: pageInDb.spaceId,
      preComputedSpaceRole: spaceRole,
      userId
    }));
  if (pageInDb.type === 'bounty' && spacePermissions.deleteAnyBounty) {
    computedPermissions.addPermissions(['read', 'delete']);
  }
  // Handle case of a page with an attached bounty
  else if (pageInDb.bounty && pageInDb.type !== 'bounty' && spacePermissions.deleteAnyBounty) {
    computedPermissions.addPermissions(['read', 'delete_attached_bounty']);
    // Delete any page in system
  } else if (!pageInDb.bounty && pageInDb.type !== 'bounty' && spacePermissions.deleteAnyPage) {
    computedPermissions.addPermissions(['read', 'delete']);
  }

  return computedPermissions.operationFlags;
}

export const computePagePermissions = buildComputePermissionsWithPermissionFilteringPolicies<
  PageResource,
  PagePermissionFlags,
  ComputeParams
>({
  resolver: pageResolver,
  computeFn: baseComputePagePermissions,
  computeSpacePermissions,
  policies: [...defaultPagePolicies]
});
