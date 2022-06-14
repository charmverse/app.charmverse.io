
import { countValidSubmissions } from 'lib/applications/shared';
import { prisma } from 'db';
import { BountyWithDetails } from '../../models/Bounty';
import { DataNotFoundError } from '../utilities/errors';
import { getBounty } from './getBounty';
import { rollupBountyStatus } from './rollupBountyStatus';

export async function closeNewApplicationsAndSubmissions (bountyId: string): Promise<BountyWithDetails> {
  const bounty = await getBounty(bountyId);
  if (!bounty) {
    throw new DataNotFoundError(`Bounty with ID ${bountyId} not found`);
  }

  const validSubs = countValidSubmissions(bounty.applications);

  await prisma.bounty.update({
    where: {
      id: bountyId
    },
    data: {
      maxSubmissions: validSubs
    }
  });

  const rollup = await rollupBountyStatus(bountyId);

  return rollup;

}
