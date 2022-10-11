import { prisma } from 'db';
import { generateAccessibleBountiesQuery } from 'lib/bounties';

import type { ApplicationWithTransactions } from '../interfaces';

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
            OR: generateAccessibleBountiesQuery({
              userId,
              spaceId
            })
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
