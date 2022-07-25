import { BountyWithDetails } from 'models';
import { prisma } from 'db';

export async function getBounty (bountyId: string): Promise<BountyWithDetails | null> {
  return prisma.bounty.findUnique({
    where: {
      id: bountyId
    },
    include: {
      applications: true,
      page: {
        select: {
          id: true
        }
      }
    }
  });
}
