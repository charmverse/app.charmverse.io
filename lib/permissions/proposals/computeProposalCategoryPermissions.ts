import type { PermissionCompute, ProposalCategoryPermissionFlags } from '@charmverse/core/permissions';
import { proposalCategoryOperations, AvailableProposalCategoryPermissions } from '@charmverse/core/permissions';
import type { SpaceRole } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { ProposalCategoryNotFoundError } from 'lib/proposal/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';

export function buildProposalCategoryPermissions({
  spaceRole
}: {
  spaceRole?: SpaceRole | null;
}): ProposalCategoryPermissionFlags {
  const permissions = new AvailableProposalCategoryPermissions();

  if (spaceRole?.isAdmin) {
    permissions.addPermissions([...proposalCategoryOperations.filter((op) => op !== 'manage_permissions')]);
    // Requester is not a space member or is a guest
  } else if (spaceRole) {
    permissions.addPermissions(['create_proposal', 'comment_proposals', 'view_category', 'vote_proposals']);
  } else {
    permissions.addPermissions(['view_category']);
  }

  return permissions.operationFlags;
}

export async function computeProposalCategoryPermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<ProposalCategoryPermissionFlags> {
  if (!isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid proposal category ID: ${resourceId}`);
  }

  const proposalCategory = await prisma.proposalCategory.findUnique({
    where: { id: resourceId },
    select: {
      id: true,
      spaceId: true
    }
  });

  if (!proposalCategory) {
    throw new ProposalCategoryNotFoundError(`${resourceId}`);
  }

  const { spaceRole } = await hasAccessToSpace({
    spaceId: proposalCategory.spaceId,
    userId
  });

  const permissions = buildProposalCategoryPermissions({
    spaceRole
  });

  return permissions;
}
