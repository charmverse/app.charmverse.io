import { prisma } from 'db';
import { BountyWithDetails } from 'models';
import { hasAccessToSpace } from 'lib/middleware';
import { accessiblePagesByPermissionsQuery } from 'lib/pages/server';
import { AvailableResourcesRequest } from '../permissions/interfaces';
import { DataNotFoundError } from '../utilities/errors';

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
  if (!userId || (userId && ((await hasAccessToSpace({ userId, spaceId })).error !== undefined))) {
    // If public bounty board is disabled, return empty list, otherwise return bounties user can access all bounties
    return !space.publicBountyBoard ? [] : prisma.bounty.findMany({
      where: {
        spaceId,
        page: {
          // Prevents returning bounties from other spaces
          spaceId,
          permissions: {
            some: {
              // Returns bounties accessible to the whole spaces
              OR: [{
                spaceId
              }, {
                public: true
              }]
            }
          }
        }
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

  return prisma.bounty.findMany({
    where: {
      spaceId,
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
