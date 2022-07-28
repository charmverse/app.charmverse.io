
import { prisma } from 'db';
import { BountyWithDetails } from '../../models/Bounty';
import { getBountyOrThrow } from './getBounty';
import { rollupBountyStatus } from './rollupBountyStatus';

export async function closeNewApplicationsAndSubmissions (bountyId: string): Promise<BountyWithDetails> {

  await getBountyOrThrow(bountyId); // herer

  await prisma.bounty.update({
    where: {
      id: bountyId
    },
    data: {
      submissionsLocked: true
    }
  });

  const rollup = await rollupBountyStatus(bountyId);

  return rollup;

}
