import type { SpaceRole, SpaceSubscriptionTier } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type {
  BulkPagePermissionCompute,
  BulkPagePermissionFlags,
  PagePermissionFlags,
  SpacePermissionFlags
} from '@packages/core/permissions';

import { proposalResourceSelect } from 'lib/proposalPermissions/proposalResolver';
import type { ProposalResource } from 'lib/proposalPermissions/proposalResolver';
import { computeSpacePermissionsForFreeSpace } from 'lib/spacePermissions/freeVersion/computeSpacePermissionsForFreeSpace';

import type { PageResource } from '../policies';
import { pageResourceSelect } from '../policies';

import { computePagePermissionsForFreeSpace } from './computePagePermissionsForFreeSpace';

export async function bulkComputePagePermissionsForFreeSpace({
  pageIds,
  userId
}: BulkPagePermissionCompute): Promise<BulkPagePermissionFlags> {
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

  const preComputedSpacePermissions: Record<string, SpacePermissionFlags> = {};

  for (const spaceId of uniqueSpaceIds) {
    preComputedSpacePermissions[spaceId] = await computeSpacePermissionsForFreeSpace({
      resourceId: spaceId,
      userId,
      preComputedSpaceRole: mappedSpaceRoles[spaceId]
    });
  }

  const PagePermissionsForFreeSpaceComputeResult: Record<string, PagePermissionFlags> = {};

  const proposals = !proposalPageIds.length
    ? []
    : await prisma.proposal.findMany({
        where: {
          id: {
            in: proposalPageIds
          }
        },
        select: proposalResourceSelect()
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

    const pagePermissionFlags = await computePagePermissionsForFreeSpace({
      resourceId: page.id,
      preComputedSpacePermissionFlags: preComputedSpacePermissions[page.spaceId],
      preComputedSpaceRole: mappedSpaceRoles[page.spaceId],
      preFetchedPermissions: page.permissions,
      preFetchedResource: page,
      userId,
      preFetchedProposalResource: pageProposal
    });

    PagePermissionsForFreeSpaceComputeResult[page.id] = pagePermissionFlags;
  }

  return PagePermissionsForFreeSpaceComputeResult;
}
