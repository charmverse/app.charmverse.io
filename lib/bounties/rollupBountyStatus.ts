import type { ApplicationStatus, BountyStatus } from '@prisma/client';

import { prisma } from 'db';
import { submissionsCapReached } from 'lib/applications/shared';
import type { BountyWithDetails } from 'lib/bounties';
import { includePagePermissions } from 'lib/pages/server';

import { countValueOccurrences } from '../utilities/numbers';

import { getBountyOrThrow } from './getBounty';

export async function rollupBountyStatus (bountyId: string): Promise<BountyWithDetails> {
  const bounty = await getBountyOrThrow(bountyId);

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
        applications: true,
        page: {
          include: includePagePermissions()
        }
      }
    }) as Promise<BountyWithDetails>;
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

