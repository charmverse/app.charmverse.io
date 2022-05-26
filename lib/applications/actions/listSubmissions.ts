import { Application, Transaction } from '@prisma/client';
import { prisma } from 'db';

export interface ApplicationWithTransactions extends Application {
  transactions: Transaction[]
}

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
