
import { prisma } from 'db';
import { BountyWithDetails } from '../../models/Bounty';
import { getBountyOrThrow } from './getBounty';
import { rollupBountyStatus } from './rollupBountyStatus';

export async function lockApplicationAndSubmissions (bountyId: string, lock?: boolean): Promise<BountyWithDetails> {

  await getBountyOrThrow(bountyId);

  await prisma.bounty.update({
    where: {
      id: bountyId
    },
    data: {
      submissionsLocked: lock ?? true
    }
  });

  const rollup = await rollupBountyStatus(bountyId);

  return rollup;

}
