import type { PermissionCompute } from '@charmverse/core/permissions';
import type { BountyPermission, BountyPermissionLevel } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

import { AvailableBountyPermissions } from './availableBountyPermissions';
import { computeBountyPermissionsPublic } from './computeBountyPermissions.public';
import type { BountyPermissionFlags } from './interfaces';
import { bountyPermissionMapping } from './mapping';

export async function computeBountyPermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<BountyPermissionFlags> {
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
  if (isAdmin) {
    basePermissions = allowedOperations.full;
  }
  // Calculate actual available permissions
  else {
    // At the point we execute this query, we are certain there is a requesting user who is a member of the target space
    const rewardPermissions = await prisma.bountyPermission.findMany({
      where: {
        bountyId: resourceId
      },
      select: {
        roleId: true,
        userId: true,
        spaceId: true,
        permissionLevel: true
      }
    });

    const mappedPermissions: Record<'space' | 'role' | 'user', Partial<BountyPermission>[]> = rewardPermissions.reduce(
      (acc, val) => {
        if (val.roleId) {
          acc.role = [...(acc.role as any), val];
        } else if (val.userId) {
          acc.user = [...(acc.user as any), val];
        } else if (val.spaceId) {
          acc.space = [...(acc.space as any), val];
        }

        return acc;
      },
      { role: [], space: [], user: [] } as Record<'space' | 'role' | 'user', BountyPermission[]>
    );
    const isRoleRestrictedReward = mappedPermissions.role.some((p) => p.permissionLevel === 'submitter');

    // Default to explicit space-wide permission
    if (!isRoleRestrictedReward) {
      allowedOperations.addPermissions(bountyPermissionMapping.submitter.slice());
    }

    const applicableRolePermissions = mappedPermissions.role.length
      ? await prisma.spaceRoleToRole.findMany({
          where: {
            spaceRole: {
              userId
            },
            roleId: {
              in: mappedPermissions.role.map((p) => p.roleId as string)
            }
          }
        })
      : [];

    const permissions = [
      ...mappedPermissions.role.filter((rolePermission) =>
        applicableRolePermissions.some((p) => p.roleId === rolePermission.roleId)
      ),
      ...mappedPermissions.user.filter((p) => p.userId === userId),
      ...mappedPermissions.space
    ];

    permissions.forEach((p) => {
      allowedOperations.addPermissions(bountyPermissionMapping[p.permissionLevel as BountyPermissionLevel].slice());
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
