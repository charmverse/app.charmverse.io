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
            createdBy: userId
          }
        },
        {
          bounty: {
            permissions: {
              some: {
                userId
              }
            }
          }
        },
        {
          bounty: {
            permissions: {
              some: {
                role: {
                  spaceRolesToRole: {
                    some: {
                      spaceRole: {
                        userId,
                        spaceId
                      }
                    }
                  }
                }
              }
            }
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
