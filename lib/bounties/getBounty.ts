import { prisma } from '@charmverse/core';

import type { BountyWithDetails } from 'lib/bounties';
import { DataNotFoundError } from 'lib/utilities/errors';

export async function getBounty(bountyId: string): Promise<BountyWithDetails | null> {
  return prisma.bounty.findUnique({
    where: {
      id: bountyId
    },
    include: {
      applications: true,
      page: {
        include: {
          permissions: {
            include: {
              sourcePermission: true
            }
          }
        }
      }
    }
  }) as Promise<BountyWithDetails | null>;
}

export async function getBountyOrThrow(bountyId: string): Promise<BountyWithDetails> {
  const bounty = await getBounty(bountyId);

  if (!bounty) {
    throw new DataNotFoundError(`Bounty with ID ${bountyId} not found`);
  }

  return bounty;
}
