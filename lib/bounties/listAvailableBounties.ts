import { prisma } from 'db';
import { BountyWithDetails } from 'models';
import { AvailableResourcesRequest } from '../permissions/interfaces';

export async function listAvailableBounties ({ spaceId, userId }: AvailableResourcesRequest): Promise<BountyWithDetails[]> {

  if (!userId) {
    return prisma.bounty.findMany({
      where: {
        spaceId,
        permissions: {
          some: {
            public: true
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
      permissions: {
        some: {
          OR: [{
            public: true
          },
          {
            userId
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
      }
    },
    include: {
      applications: true
    }
  });

}
