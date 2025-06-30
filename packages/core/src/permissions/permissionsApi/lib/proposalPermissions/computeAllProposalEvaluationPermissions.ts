import { prisma } from '@charmverse/core/prisma-client';
import type { PermissionCompute, ProposalPermissionFlags } from '@packages/core/permissions';
import { hasAccessToSpace } from '@packages/core/permissions';

import { proposalResolver } from '../proposalPermissions/proposalResolver';
import { computeSpacePermissions } from '../spacePermissions/computeSpacePermissions';
import { computeSpacePermissionsForFreeSpace } from '../spacePermissions/freeVersion/computeSpacePermissionsForFreeSpace';

import { computeProposalEvaluationPermissions } from './computeProposalEvaluationPermissions';
import { computeProposalEvaluationPermissionsForFreeSpace } from './freeVersion/computeProposalEvaluationPermissionsForFreeSpace';

export async function computeAllProposalEvaluationPermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<Record<string, ProposalPermissionFlags>> {
  const proposalResource = await proposalResolver({ resourceId });

  const { spaceRole } = await hasAccessToSpace({ spaceId: proposalResource.spaceId, userId });

  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: proposalResource.spaceId
    },
    select: {
      paidTier: true
    }
  });

  const userRoleMemberships = spaceRole
    ? await prisma.spaceRoleToRole
        .findMany({
          where: {
            spaceRoleId: spaceRole.id
          }
        })
        .then((data) => data.map((sr) => ({ roleId: sr.roleId })))
    : [];

  const spacePermissions = await (
    space.paidTier === 'free' ? computeSpacePermissionsForFreeSpace : computeSpacePermissions
  )({
    resourceId: proposalResource.spaceId,
    preComputedSpaceRole: spaceRole,
    userId
  });

  const computePermissionsFunction =
    space.paidTier === 'free' ? computeProposalEvaluationPermissionsForFreeSpace : computeProposalEvaluationPermissions;

  const permissions = await Promise.all([
    // include permissions for draft state
    computePermissionsFunction({
      resourceId: proposalResource.id,
      userId,
      preFetchedResource: {
        ...proposalResource,
        status: 'draft'
      },
      preComputedSpaceRole: spaceRole,
      preFetchedUserRoleMemberships: userRoleMemberships,
      preComputedSpacePermissionFlags: spacePermissions
    }).then((evaluationPermissions) => ({ evaluationId: 'draft', evaluationPermissions })),
    ...proposalResource.evaluations.map((evaluation) =>
      computePermissionsFunction({
        evaluationId: evaluation.id,
        resourceId: proposalResource.id,
        userId,
        preFetchedResource: proposalResource,
        preComputedSpaceRole: spaceRole,
        preFetchedUserRoleMemberships: userRoleMemberships,
        preComputedSpacePermissionFlags: spacePermissions
      }).then((evaluationPermissions) => ({ evaluationId: evaluation.id, evaluationPermissions }))
    )
  ]).then((data) =>
    data.reduce(
      (acc, curr) => {
        acc[curr.evaluationId] = curr.evaluationPermissions;
        return acc;
      },
      {} as Record<string, ProposalPermissionFlags>
    )
  );

  return permissions;
}
