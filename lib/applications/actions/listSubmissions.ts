import { prisma } from 'db';
import { ApplicationWithTransactions } from '../interfaces';

/**
 * Returns only valid submissions
 * @param bountyId
 * @returns
 */
export async function listSubmissions (bountyId: string): Promise<ApplicationWithTransactions[]> {
  return prisma.application.findMany({
    where: {
      bountyId,
      AND: {
        status: {
          notIn: ['applied', 'rejected']
        }
      }
    },
    include: {
      transactions: true
    }
  });
}
