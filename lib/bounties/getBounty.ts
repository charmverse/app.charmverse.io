import { BountyWithDetails } from 'models';
import { prisma } from 'db';

export async function getBounty (bountyId: string, includePage: boolean = false): Promise<BountyWithDetails | null> {
  return prisma.bounty.findUnique({
    where: {
      id: bountyId
    },
    include: {
      applications: true,
      page: includePage && {
        include: {
          permissions: {
            include: {
              sourcePermission: true
            }
          }
        }
      }
    }
  });
}
