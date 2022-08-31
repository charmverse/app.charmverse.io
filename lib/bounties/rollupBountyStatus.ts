import { ApplicationStatus, BountyStatus } from '@prisma/client';
import { prisma } from 'db';
import { submissionsCapReached } from 'lib/applications/shared';
import { includePagePermissions } from 'lib/pages/server';
import { BountyWithDetails } from 'models';
import { countValueOccurrences } from '../utilities/numbers';
import { getBountyOrThrow } from './getBounty';

export async function rollupBountyStatus (bountyId: string): Promise<BountyWithDetails> {
  const bounty = await getBountyOrThrow(bountyId);

  // No-op on bounty suggestions. They need to be approved first
  if (bounty.status === 'suggestion') {
    return bounty;
  }

  const capReached = submissionsCapReached({
    bounty,
    submissions: bounty.applications
  });

  if (!capReached) {
    return statusUpdate(bounty.id, 'open');
  }

  const submissionSummary = countValueOccurrences<ApplicationStatus>(bounty.applications, 'status');

  if (submissionSummary.inProgress > 0 || submissionSummary.review > 0) {
    return statusUpdate(bounty.id, 'inProgress');
  }
  else if (submissionSummary.complete > 0) {
    return statusUpdate(bounty.id, 'complete');
  }
  else if (submissionSummary.paid === bounty.maxSubmissions) {
    return statusUpdate(bounty.id, 'paid');
  }

  return bounty;

}

function statusUpdate (bountyId: string, newStatus: BountyStatus): Promise<BountyWithDetails> {
  return prisma.bounty.update({
    where: {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      id: bountyId
    },
    data: {
      status: newStatus
    },
    include: {
      applications: true,
      page: {
        include: includePagePermissions()
      }
    }
  }) as Promise<BountyWithDetails>;
}
