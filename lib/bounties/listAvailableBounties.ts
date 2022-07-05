import { prisma } from 'db';
import { BountyWithDetails } from 'models';
import { hasAccessToSpace } from 'lib/middleware';
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
        permissions: {
          some: {
            // Provides all bounties open to the public, or to the space
            OR: [{
              public: true
            }, {
              spaceId
            }]

          }
        }
      },
      include: {
        applications: true
      }
    });
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
      ]

    },
    include: {
      applications: true
    }
  });

}
