import { SpaceOperation, Prisma } from '@prisma/client';
import { prisma } from 'db';
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
    }
  });

  if (!bounty) {
    return allowedOperations.empty;
  }

  // Handle public request case and only enforce view permission
  if (!userId) {
    const publicViewPermission = await prisma.bountyPermission.findFirst({
      where: {
        bountyId: bounty.id,
        public: true,
        permissionLevel: 'viewer'
      }
    });

    if (!publicViewPermission) {
      return allowedOperations.empty;
    }
    else {
      allowedOperations.addPermissions(bountyPermissionMapping.viewer.slice());
      return allowedOperations.operationFlags;
    }

  }

  const { error, isAdmin } = await hasAccessToSpace({
    userId,
    spaceId: bounty.spaceId,
    adminOnly: false
  });

  if (error) {
    // User is not a space member, treat them as a member of the public
    return computeBountyPermissions({
      allowAdminBypass: false,
      resourceId
      // No user id since this person is not a space member
    });
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
