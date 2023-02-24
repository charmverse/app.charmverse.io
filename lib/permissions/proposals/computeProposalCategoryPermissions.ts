import { prisma } from 'db';
import { ProposalCategoryNotFoundError } from 'lib/proposal/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';

import type { PermissionCompute } from '../interfaces';

import { AvailableProposalCategoryPermissions } from './availableProposalCategoryPermissions.class';
import type { AvailableProposalCategoryPermissionFlags } from './interfaces';
import { proposalCategoryPermissionsMapping } from './mapping';

export async function computeProposalCategoryPermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<AvailableProposalCategoryPermissionFlags> {
  if (!isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid proposal category ID: ${resourceId}`);
  }

  const proposalCategory = await prisma.proposalCategory.findUnique({
    where: { id: resourceId }
  });

  if (!proposalCategory) {
    throw new ProposalCategoryNotFoundError(`${resourceId}`);
  }

  const { error, isAdmin } = await hasAccessToSpace({
    spaceId: proposalCategory.spaceId,
    userId
  });

  const permissions = new AvailableProposalCategoryPermissions();

  if (isAdmin) {
    return permissions.full;

    // Requester is not a space member
  } else if (error) {
    return permissions.empty;
  }

  const assignedPermissions = await prisma.proposalCategoryPermission.findMany({
    where: {
      proposalCategoryId: resourceId,
      OR: [
        {
          spaceId: proposalCategory.spaceId
        },
        {
          role: {
            spaceRolesToRole: {
              some: {
                spaceRole: {
                  userId
                }
              }
            }
          }
        }
      ]
    }
  });

  assignedPermissions.forEach((permission) => {
    permissions.addPermissions(proposalCategoryPermissionsMapping[permission.permissionLevel]);
  });

  return permissions.operationFlags;
}
