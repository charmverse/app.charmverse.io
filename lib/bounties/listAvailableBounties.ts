import { prisma } from 'db';
import type { BountyWithDetails } from 'lib/bounties';
import { hasAccessToSpace } from 'lib/middleware';
import { accessiblePagesByPermissionsQuery, includePagePermissions } from 'lib/pages/server';

import type { AvailableResourcesRequest } from '../permissions/interfaces';
import { DataNotFoundError } from '../utilities/errors';

export function generateAccessibleBountiesQuery ({ userId, spaceId }: { userId: string, spaceId: string }) {
  return [
    {
      space: {
        spaceRoles: {
          some: {
            userId,
            isAdmin: true
          }
        }
      }
    },
    {
      createdBy: userId
    },
    {
      permissions: {
        some: {
          OR: [{
            public: true
          },
          {
            user: {
              id: userId
            }
          },
          {
            role: {
              spaceRolesToRole: {
                some: {
                  spaceRole: {
                    spaceId,
                    userId
                  }
                }
              }
            }
          },
          {
            space: {
              id: spaceId,
              spaceRoles: {
                some: {
                  userId
                }
              }
            }
          }]
        }
      } }
  ];
}

export async function listAvailableBounties ({ spaceId, userId }: AvailableResourcesRequest): Promise<BountyWithDetails[]> {

  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    },
    select: {
      publicBountyBoard: true
    }
  });

  if (!space) {
    throw new DataNotFoundError(`Space with id ${spaceId} not found`);
  }

  // Make sure a requesting user has access to the space, otherwise treat them as a member of the public
  if (!userId || (userId && (await hasAccessToSpace({ userId, spaceId })).error !== undefined)) {
    // If public bounty board is disabled, return empty list, otherwise return bounties user can access all bounties
    return !space.publicBountyBoard ? [] : prisma.bounty.findMany({
      where: {
        spaceId,
        page: {
          // Prevents returning bounties from other spaces
          spaceId,
          deletedAt: null,
          permissions: {
            some: {
              public: true
            }
          }
        }
      },
      include: {
        applications: true,
        page: {
          include: includePagePermissions()
        }
      }
    }) as Promise<BountyWithDetails[]>;
  }

  return prisma.bounty.findMany({
    where: {
      spaceId,
      page: {
        deletedAt: null
      },
      OR: [
        // Admin override
        {
          space: {
            spaceRoles: {
              some: {
                userId,
                isAdmin: true
              }
            }
          }
        },
        {
          page: {
            permissions: accessiblePagesByPermissionsQuery({
              spaceId,
              userId
            })
          }
        }
      ]
    },
    include: {
      applications: true,
      page: {
        include: {
          permissions: {
            include: {
              sourcePermission: true
            }
          }
        }
      }
    }
  }) as Promise<BountyWithDetails[]>;

}
