import { SpaceOperation, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { isTruthy } from 'lib/utilities/types';
import { hasAccessToSpace } from '../../middleware';
import { SpaceMembershipRequiredError } from '../errors';
import { PermissionComputeRequest } from '../interfaces';
import { AvailableBountyPermissions } from './availableBountyPermissions';
import { BountyPermissionFlags } from './interfaces';
import { bountyPermissionMapping } from './mapping';

export async function computeBountyPermissions ({
  allowAdminBypass,
  resourceId,
  userId
}: PermissionComputeRequest): Promise<BountyPermissionFlags> {

  const allowedOperations = new AvailableBountyPermissions();

  const bounty = await prisma.bounty.findUnique({
    where: {
      id: resourceId
    },
    select: {
      id: true,
      spaceId: true,
      createdBy: true,
      page: {
        select: {
          permissions: {
            include: {
              sourcePermission: true
            }
          }
        }
      }
    }
  });

  // Bounty permissions allow interaction with a bounty. Users need to be a member of the bounty space to be eligible for any permissions
  // Page permissions apply for whether a user can view a bounty
  if (!bounty || !userId) {
    return allowedOperations.empty;
  }

  const { error, isAdmin } = await hasAccessToSpace({
    userId,
    spaceId: bounty.spaceId,
    adminOnly: false
  });

  if (error) {
    return allowedOperations.empty;
  }

  if (isAdmin && allowAdminBypass) {
    return allowedOperations.full;
  }

  // At the point we execute this query, we are certain there is a requesting user who is a member of the target space
  const query: Prisma.BountyPermissionWhereInput = {
    AND: [
      {
        bountyId: resourceId
      },
      {
        OR: [
          {
            public: true
          },
          {
            spaceId: bounty.spaceId
          },
          {
            userId
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
    ]
  };

  const bountyPermissions = await prisma.bountyPermission.findMany({
    where: query
  });

  bountyPermissions.forEach(p => {
    allowedOperations.addPermissions(bountyPermissionMapping[p.permissionLevel].slice());
  });

  if (bounty.createdBy === userId) {
    allowedOperations.addPermissions(bountyPermissionMapping.creator.slice());
  }

  return allowedOperations.operationFlags;
}
