import { BountyWithDetails } from 'models';
import { prisma } from 'db';
import { includePagePermissions } from 'lib/pages/server';

export async function getBounty (bountyId: string): Promise<BountyWithDetails | null> {
  return prisma.bounty.findUnique({
    where: {
      id: bountyId
    },
    include: {
      applications: true,
      page: {
        include: includePagePermissions()
      }
    }
  }) as Promise<BountyWithDetails | null>;
}
