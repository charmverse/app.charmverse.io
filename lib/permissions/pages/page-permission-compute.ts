import type { PermissionFilteringPolicyFnInput } from '@charmverse/core';
import { buildComputePermissionsWithPermissionFilteringPolicies, prisma } from '@charmverse/core';
import type { Prisma } from '@charmverse/core/prisma';

import { PageNotFoundError } from 'lib/pages/server';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { typedKeys } from 'lib/utilities/objects';

import { filterApplicablePermissions } from '../filterApplicablePermissions';
import type { PermissionCompute } from '../interfaces';

import { AllowedPagePermissions } from './available-page-permissions.class';
import type { IPagePermissionFlags, PageOperationType } from './page-permission-interfaces';
import { permissionTemplates } from './page-permission-mapping';
import { computePagePermissionsUsingProposalPermissions } from './pagePermissionsWithComputeProposalPermissions';

type PageInDb = {
  id: string;
  proposalId: string | null;
  convertedProposalId: string | null;
};

function pageResolver({ resourceId }: { resourceId: string }) {
  return prisma.page.findUnique({
    where: {
      id: resourceId
    },
    select: {
      id: true,
      proposalId: true,
      convertedProposalId: true
    }
  }) as Promise<PageInDb>;
}

type PagePolicyInput = PermissionFilteringPolicyFnInput<PageInDb, IPagePermissionFlags>;

async function convertedToProposalPolicy({ flags, resource }: PagePolicyInput): Promise<IPagePermissionFlags> {
  const newPermissions = { ...flags };

  if (!resource.convertedProposalId) {
    return newPermissions;
  }

  const allowedOperations: PageOperationType[] = ['read'];

  typedKeys(flags).forEach((flag) => {
    if (!allowedOperations.includes(flag)) {
      newPermissions[flag] = false;
    }
  });

  return newPermissions;
}

async function baseComputeUserPagePermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<IPagePermissionFlags> {
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

  if (isAdmin) {
    return new AllowedPagePermissions().full;
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

  const pagePermissions = await prisma.pagePermission.findMany({
    where: {
      pageId,
      ...whereQuery
    }
  });
  const applicablePermissions = await filterApplicablePermissions({
    permissions: pagePermissions,
    resourceSpaceId: pageInDb.spaceId,
    userId
  });

  const computedPermissions = new AllowedPagePermissions();

  applicablePermissions.forEach((permission) => {
    computedPermissions.addPermissions(
      permission.permissionLevel === 'custom' ? permission.permissions : permissionTemplates[permission.permissionLevel]
    );
  });
  return computedPermissions.operationFlags;
}

export const computeUserPagePermissions = buildComputePermissionsWithPermissionFilteringPolicies<
  PageInDb,
  IPagePermissionFlags
>({
  resolver: pageResolver,
  computeFn: baseComputeUserPagePermissions,
  policies: [convertedToProposalPolicy]
});
