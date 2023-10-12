import { prisma } from '@charmverse/core/prisma-client';

import type { BountyWithDetails } from 'lib/bounties';

import { getBountyOrThrow } from './getBounty';
import { rollupBountyStatus } from './rollupBountyStatus';

export async function lockApplicationAndSubmissions({
  bountyId,
  lock,
  userId
}: {
  bountyId: string;
  lock?: boolean;
  userId: string;
}): Promise<BountyWithDetails> {
  await getBountyOrThrow(bountyId);

  await prisma.bounty.update({
    where: {
      id: bountyId
    },
    data: {
      submissionsLocked: lock ?? true
    }
  });

  const rollup = await rollupBountyStatus({
    bountyId,
    userId
  });

  return rollup;
}
