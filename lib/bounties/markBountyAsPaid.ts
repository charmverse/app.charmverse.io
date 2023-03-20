import { prisma } from 'db';
import type { BountyWithDetails } from 'lib/bounties';
import { includePagePermissions } from 'lib/pages/server';
import { InvalidInputError } from 'lib/utilities/errors';

import { getBountyOrThrow } from './getBounty';

export async function markBountyAsPaid(bountyId: string): Promise<BountyWithDetails> {
  const bounty = await getBountyOrThrow(bountyId);

  if (bounty.customReward === null) {
    throw new InvalidInputError('Only bounties with custom rewards can be marked as paid manually');
  }

  return prisma.bounty.update({
    where: {
      id: bounty.id
    },
    data: {
      status: 'paid'
    },
    include: {
      applications: true,
      page: {
        include: includePagePermissions()
      }
    }
  }) as Promise<BountyWithDetails>;
}
