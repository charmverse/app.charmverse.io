import { prisma } from '@charmverse/core';
import type { AssignedProposalCategoryPermission, PermissionCompute, SpaceResourcesRequest } from '@charmverse/core';

import { ProposalCategoryNotFoundError } from 'lib/proposal/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';

import { mapProposalCategoryPermissionToAssignee } from './mapProposalCategoryPermissionToAssignee';

export async function listProposalCategoryPermissions({
  resourceId,
  userId
}: SpaceResourcesRequest): Promise<AssignedProposalCategoryPermission[]> {
  if (!isUUID(resourceId)) {
    throw new InvalidInputError('Invalid proposal category ID');
  }

  const proposalCategory = await prisma.proposalCategory.findUnique({
    where: {
      id: resourceId
    },
    select: {
      spaceId: true
    }
  });

  if (!proposalCategory) {
    throw new ProposalCategoryNotFoundError(resourceId);
  }

  const { error } = await hasAccessToSpace({
    spaceId: proposalCategory.spaceId,
    userId
  });

  if (error) {
    return [];
  }

  const permissions = await prisma.proposalCategoryPermission.findMany({
    where: {
      proposalCategoryId: resourceId
    }
  });

  const mappedPermissions: AssignedProposalCategoryPermission[] = permissions
    .map((permission) => {
      try {
        const mapped = mapProposalCategoryPermissionToAssignee(permission);
        return mapped;
      } catch (err) {
        return null;
      }
    })
    .filter((permission) => permission !== null) as AssignedProposalCategoryPermission[];

  return mappedPermissions;
}
