import type { SpaceRole, SpaceRoleToRole, SpaceSubscriptionTier } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type {
  BulkPagePermissionCompute,
  BulkPagePermissionFlags,
  PagePermissionFlags,
  SpacePermissionFlags
} from '@packages/core/permissions';

import { proposalResourceSelect } from '../proposalPermissions/proposalResolver';
import type { ProposalResource } from '../proposalPermissions/proposalResolver';
import { computeSpacePermissions } from '../spacePermissions/computeSpacePermissions';

import { computePagePermissions } from './computePagePermissions';
import type { PageResource } from './policies';
import { pageResourceSelect } from './policies';

export async function bulkComputePagePermissions({
  pageIds,
  userId
}: BulkPagePermissionCompute): Promise<BulkPagePermissionFlags> {
  if (!pageIds || !pageIds.length) {
    return {};
  }

  // Preload all relevant pages
  const resources = await prisma.page.findMany({
    where: {
      id: {
        in: pageIds
      }
    },
    select: { ...pageResourceSelect(), permissions: true }
  });

  const proposalPageIds: string[] = [];

  // Map Pages to a record, and extract unique spaceIds
  const mappedData = resources.reduce(
    (acc, resource) => {
      acc.pages[resource.id] = resource;

      acc.spaceIds[resource.spaceId] = resource.spaceId;

      if (resource.type === 'proposal') {
        proposalPageIds.push(resource.id);
      }

      return acc;
    },
    {
      spaceIds: {} as Record<string, string>,
      pages: {} as Record<string, PageResource>
    }
  );

  const uniqueSpaceIds = Object.keys(mappedData.spaceIds);

  const spaceRoles = !userId
    ? []
    : await prisma.spaceRole.findMany({
        where: {
          OR: uniqueSpaceIds.map((spaceId) => ({ spaceId, userId }))
        },
        include: {
          space: {
            select: {
              subscriptionTier: true
            }
          }
        }
      });

  // Load space roles and attached role memberships for that role
  const mappedSpaceRoles = uniqueSpaceIds.reduce(
    (acc, spaceId) => {
      acc[spaceId] = spaceRoles.find((sr) => sr.spaceId === spaceId) ?? null;
      return acc;
    },
    {} as Record<string, (SpaceRole & { space: { subscriptionTier: SpaceSubscriptionTier | null } }) | null>
  );
  const roleMemberships =
    !userId || !spaceRoles.length
      ? []
      : await prisma.spaceRoleToRole.findMany({
          where: {
            spaceRoleId: {
              in: spaceRoles.map((sr) => sr.id)
            }
          },
          select: {
            spaceRoleId: true,
            roleId: true
          }
        });

  const mappedRoleMemberships = uniqueSpaceIds.reduce(
    (acc, spaceId) => {
      const spaceRoleId = mappedSpaceRoles[spaceId]?.id;
      if (spaceRoleId) {
        acc[spaceId] = roleMemberships.filter((rm) => rm.spaceRoleId === spaceRoleId);
      } else {
        acc[spaceId] = [];
      }
      return acc;
    },
    {} as Record<string, Pick<SpaceRoleToRole, 'roleId'>[]>
  );

  const preComputedSpacePermissions: Record<string, SpacePermissionFlags> = {};

  for (const spaceId of uniqueSpaceIds) {
    preComputedSpacePermissions[spaceId] = await computeSpacePermissions({
      resourceId: spaceId,
      userId,
      preComputedSpaceRole: mappedSpaceRoles[spaceId],
      preFetchedUserRoleMemberships: mappedRoleMemberships[spaceId]
    });
  }

  const pagePermissionsComputeResult: Record<string, PagePermissionFlags> = {};

  const proposals = !proposalPageIds
    ? []
    : await prisma.proposal.findMany({
        where: {
          id: {
            in: proposalPageIds
          }
        },
        select: {
          ...proposalResourceSelect()
        }
      });

  const mappedProposals = proposals.reduce(
    (acc, proposal) => {
      acc.proposals[proposal.id] = proposal;
      return acc;
    },
    {
      proposals: {} as Record<string, ProposalResource>
    }
  );

  for (const page of resources) {
    const pageProposal = mappedProposals.proposals[page.id];

    const pagePermissionFlags = await computePagePermissions({
      resourceId: page.id,
      preComputedSpacePermissionFlags: preComputedSpacePermissions[page.spaceId],
      preComputedSpaceRole: mappedSpaceRoles[page.spaceId],
      preFetchedPermissions: page.permissions,
      preFetchedResource: page,
      userId,
      preFetchedProposalResource: pageProposal
    });

    pagePermissionsComputeResult[page.id] = pagePermissionFlags;
  }

  return pagePermissionsComputeResult;
}
