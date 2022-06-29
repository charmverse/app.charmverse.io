import { prisma } from 'db';
import { getGroupsWithOperations, queryBountyPermissions } from 'lib/permissions/bounties';
import { countRoleMembers } from 'lib/roles';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { BountyPermissions, BountySubmitterPoolCalculation, BountySubmitterPoolSize } from './interfaces';

/**
 * Returns the number of potential bounty applicants.
 * You can also permissions to simulate how many people have access to the bounty.
 * @param param0
 */
export async function calculateBountySubmitterPoolSize ({ resourceId, permissions }:
  BountySubmitterPoolCalculation): Promise<BountySubmitterPoolSize> {

  if (!resourceId && !permissions) {
    throw new InvalidInputError('Please provide at least a resource id or a set of permissions to simulate for');
  }

  if (!resourceId && permissions) {
    const groupsWhoCouldSubmit = getGroupsWithOperations(['work']).map(permissionLevel => {
      return permissions[permissionLevel] ?? [];
    }).flat();

    const spacePermission = groupsWhoCouldSubmit.find(p => p.group === 'space');

    if (spacePermission) {
      const spaceMembers = await prisma.spaceRole.count({
        where: {
          spaceId: spacePermission.id,
          user: {
            isBot: {
              not: true
            }
          }
        }
      });

      return {
        mode: 'space',
        roleups: [],
        total: spaceMembers
      };
    }

    // Get only relevant roles
    const roleups = await Promise.all(groupsWhoCouldSubmit
      .filter(g => {
        return g.group === 'role';
      })
      .map(async group => {
        return countRoleMembers({
          roleId: group.id as string
        });
      }));

    // Get unique user memberships as some may be members of a role multiple times
    const total = await prisma.spaceRole.count({
      where: {
        OR: roleups.map(roleup => {
          return {
            spaceRoleToRole: {
              some: {
                roleId: roleup.id
              }
            }
          };
        })
      }
    });

    return {
      mode: 'role',
      roleups,
      total
    };
  }

  const bounty = await prisma.bounty.findUnique({
    where: {
      id: resourceId
    },
    select: {
      id: true,
      spaceId: true
    }
  });

  if (!bounty) {
    throw new DataNotFoundError(`Bounty with id ${resourceId} not found`);
  }

  const permissionsToUse = permissions ?? await queryBountyPermissions({
    bountyId: bounty.id
  });

  // Logic copied above for time saving
  const groupsWhoCouldSubmit = getGroupsWithOperations(['work']).map(permissionLevel => {
    return permissionsToUse[permissionLevel] ?? [];
  }).flat();

  const hasSpacePermission = groupsWhoCouldSubmit.find(p => p.group === 'space');

  if (hasSpacePermission) {
    const spaceMembers = await prisma.spaceRole.count({
      where: {
        spaceId: bounty.spaceId,
        user: {
          isBot: {
            not: true
          }
        }
      }
    });

    return {
      mode: 'space',
      roleups: [],
      total: spaceMembers
    };
  }

  // Get only relevant roles
  const roleups = await Promise.all(groupsWhoCouldSubmit
    .filter(g => {
      return g.group === 'role';
    })
    .map(async group => {
      return countRoleMembers({
        roleId: group.id as string
      });
    }));

  // Get unique user memberships as some may be members of a role multiple times
  const total = await prisma.spaceRole.count({
    where: {
      OR: roleups.map(roleup => {
        return {
          spaceRoleToRole: {
            some: {
              roleId: roleup.id
            }
          }
        };
      })
    }
  });

  return {
    mode: 'role',
    roleups,
    total
  };

}
