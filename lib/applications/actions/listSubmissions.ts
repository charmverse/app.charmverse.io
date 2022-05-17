import { Application, Bounty } from '@prisma/client';
import { prisma } from 'db';
import { DataNotFoundError } from '../../utilities/errors';

/**
 * Returns only valid submissions
 * @param bountyId
 * @returns
 */
export async function listSubmissions (bountyId: string): Promise<Application[]> {

  return prisma.application.findMany({
    where: {
      bountyId,
      AND: {
        status: {
          notIn: ['applied', 'rejected']
        }
      }
    }
  });
}
