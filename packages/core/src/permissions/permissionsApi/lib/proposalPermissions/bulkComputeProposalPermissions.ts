import { prisma } from '@charmverse/core/prisma-client';
import type { SmallProposalPermissionFlags, SpaceResourcesRequest } from '@packages/core/permissions';

import { proposalResourceSelect } from '../proposalPermissions/proposalResolver';
import { computeSpacePermissions } from '../spacePermissions/computeSpacePermissions';

import { computeProposalEvaluationPermissions } from './computeProposalEvaluationPermissions';

export async function bulkComputeProposalPermissions({
  spaceId,
  userId
}: SpaceResourcesRequest): Promise<Record<string, SmallProposalPermissionFlags>> {
  if (!spaceId) {
    return {};
  }

  // Preload all relevant pages
  const resources = await prisma.proposal.findMany({
    where: {
      spaceId
    },
    select: { ...proposalResourceSelect(), page: { select: { permissions: true } } }
  });

  const spaceRole = !userId
    ? null
    : await prisma.spaceRole.findFirst({
        where: {
          spaceId,
          userId
        },
        include: {
          space: {
            select: {
              subscriptionTier: true
            }
          }
        }
      });

  const roleMemberships =
    !userId || !spaceRole
      ? []
      : await prisma.spaceRoleToRole.findMany({
          where: {
            spaceRoleId: spaceRole.id
          },
          select: {
            spaceRoleId: true,
            roleId: true
          }
        });

  const preComputedSpacePermissions = await computeSpacePermissions({
    resourceId: spaceId,
    userId,
    preComputedSpaceRole: spaceRole,
    preFetchedUserRoleMemberships: roleMemberships
  });

  const proposalPermissionsComputeResult: Record<string, SmallProposalPermissionFlags> = {};

  for (const proposal of resources) {
    const proposalPermissionFlags = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      preComputedSpacePermissionFlags: preComputedSpacePermissions,
      preComputedSpaceRole: spaceRole,
      preFetchedPermissions: proposal.page?.permissions ?? [],
      preFetchedResource: proposal,
      userId,
      preFetchedUserRoleMemberships: roleMemberships
    });

    proposalPermissionsComputeResult[proposal.id] = {
      evaluate: proposalPermissionFlags.evaluate,
      view: proposalPermissionFlags.view,
      view_notes: proposalPermissionFlags.view_notes,
      view_private_fields: proposalPermissionFlags.view_private_fields
    };
  }

  return proposalPermissionsComputeResult;
}
