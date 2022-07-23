import { prisma } from 'db';
import { ApplicationWithTransactions } from '../interfaces';

/**
 * Returns only valid applications
 * @param bountyId
 * @returns
 */
export async function listAccessibleApplications (
  { bountyId, spaceId, userId }:
    { bountyId: string, userId: string, spaceId: string }
): Promise<ApplicationWithTransactions[]> {

  return prisma.application.findMany({
    where: {
      bountyId,
      OR: [
        {
          bounty: {
            OR: [
              {
                createdBy: userId
              },
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
                }
              }
            ]
          }
        },
        {
          createdBy: userId
        }
      ]
    },
    include: {
      transactions: true
    }
  });
}
