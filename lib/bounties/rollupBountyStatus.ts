import { ApplicationStatus, BountyStatus } from '@prisma/client';
import { prisma } from 'db';
import { submissionsCapReached } from 'lib/applications/shared';
import { DataNotFoundError } from 'lib/utilities/errors';
import { BountyWithDetails } from 'models';
import { countValueOccurrences } from '../utilities/numbers';
import { getBounty } from './getBounty';

export async function rollupBountyStatus (bountyId: string): Promise<BountyWithDetails> {
  const bounty = await getBounty(bountyId);
  if (!bounty) {
    throw new DataNotFoundError(`Bounty with id ${bountyId} not found`);
  }

  // No-op on bounty suggestions. They need to be approved first
  if (bounty.status === 'suggestion') {
    return bounty;
  }

  function statusUpdate (newStatus: BountyStatus): Promise<BountyWithDetails> {
    return prisma.bounty.update({
      where: {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        id: bounty!.id
      },
      data: {
        status: newStatus
      },
      include: {
        applications: true
      }
    });
  }

  const capReached = submissionsCapReached({
    bounty,
    submissions: bounty.applications
  });

  if (!capReached) {
    return statusUpdate('open');
  }

  const submissionSummary = countValueOccurrences<ApplicationStatus>(bounty.applications, 'status');

  if (submissionSummary.inProgress > 0 || submissionSummary.review > 0) {
    return statusUpdate('inProgress');
  }
  else if (submissionSummary.complete > 0) {
    return statusUpdate('complete');
  }
  else if (submissionSummary.paid === bounty.maxSubmissions) {
    return statusUpdate('paid');
  }

  return bounty;

}

