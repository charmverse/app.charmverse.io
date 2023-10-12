import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

import type { PermissionComputeRequest } from '../interfaces';

import { AvailableBountyPermissions } from './availableBountyPermissions';
import { computeBountyPermissionsPublic } from './computeBountyPermissions.public';
import type { BountyPermissionFlags } from './interfaces';
import { bountyPermissionMapping } from './mapping';

export async function computeBountyPermissions({
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
      space: {
        select: {
          paidTier: true
        }
      },
      createdBy: true,
      permissions: true,
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

  if (bounty.space.paidTier === 'free') {
    return computeBountyPermissionsPublic({
      userId,
      bounty
    });
  }

  const { error, isAdmin } = await hasAccessToSpace({
    userId,
    spaceId: bounty.spaceId,
    adminOnly: false
  });

  if (error) {
    return allowedOperations.empty;
  }

  // Start actually evaluating permissions
  let basePermissions = allowedOperations.empty as BountyPermissionFlags;

  // Provision full set of operations
  if (isAdmin && allowAdminBypass) {
    basePermissions = allowedOperations.full;
  }
  // Calculate actual available permissions
  else {
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

    bountyPermissions.forEach((p) => {
      allowedOperations.addPermissions(bountyPermissionMapping[p.permissionLevel].slice());
    });
    basePermissions = allowedOperations.operationFlags;
  }

  // ADD case-specific permissions
  // 1. If the bounty is created by the user, they always have creator-like abilities
  if (bounty.createdBy === userId) {
    bountyPermissionMapping.creator.forEach((op) => {
      basePermissions[op] = true;
    });
  }

  return basePermissions;
}
