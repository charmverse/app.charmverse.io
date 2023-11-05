import type {
  BulkPagePermissionCompute,
  BulkPagePermissionFlags,
  PagePermissionFlags,
  PageResource,
  ProposalResource,
  SpacePermissionFlags
} from '@charmverse/core/permissions';
import { pageResourceSelect, proposalResourceSelect } from '@charmverse/core/permissions';
import type { ProposalCategoryPermission, SpaceRole } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { computeSpacePermissions } from 'lib/permissions/spaces/computeSpacePermissions';

import { computePagePermissions } from './computePagePermissions';

export async function bulkComputePagePermissions({
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
        }
      });

  // Load space roles and attached role memberships for that role
  const mappedSpaceRoles = uniqueSpaceIds.reduce((acc, spaceId) => {
    acc[spaceId] = spaceRoles.find((sr) => sr.spaceId === spaceId) ?? null;
    return acc;
  }, {} as Record<string, SpaceRole | null>);

  const preComputedSpacePermissions: Record<string, SpacePermissionFlags> = {};

  for (const spaceId of uniqueSpaceIds) {
    preComputedSpacePermissions[spaceId] = await computeSpacePermissions({
      resourceId: spaceId,
      userId,
      preComputedSpaceRole: mappedSpaceRoles[spaceId]
    });
  }

  const pagePermissionsComputeResult: Record<string, PagePermissionFlags> = {};

  const proposals = !proposalPageIds.length
    ? []
    : await prisma.proposal.findMany({
        where: {
          id: {
            in: proposalPageIds
          }
        },
        select: {
          ...proposalResourceSelect(),
          space: {
            select: {
              publicProposals: true
            }
          }
        }
      });

  const mappedProposals = proposals.reduce(
    (acc, proposal) => {
      acc.categoryIds[proposal.categoryId as string] = proposal.categoryId as string;
      acc.proposals[proposal.id] = proposal;
      return acc;
    },
    {
      proposals: {} as Record<string, ProposalResource>,
      categoryIds: {} as Record<string, string>
    }
  );

  const mappedProposalCategoryPermissions: Record<string, ProposalCategoryPermission[]> =
    await prisma.proposalCategoryPermission
      .findMany({
        where: {
          proposalCategoryId: {
            in: Object.keys(mappedProposals.categoryIds)
          }
        }
      })
      .then((proposalCategoryPermissions) =>
        proposalCategoryPermissions.reduce((acc, permission) => {
          if (!acc[permission.proposalCategoryId]) {
            acc[permission.proposalCategoryId] = [];
          }
          acc[permission.proposalCategoryId].push(permission);
          return acc;
        }, {} as Record<string, ProposalCategoryPermission[]>)
      );

  let index = 0;

  for (const page of resources) {
    index += 1;
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
