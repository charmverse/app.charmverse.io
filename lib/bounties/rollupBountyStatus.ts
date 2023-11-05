import type { ApplicationStatus, BountyStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { submissionsCapReached } from 'lib/applications/shared';
import type { BountyWithDetails } from 'lib/bounties';
import { includePagePermissionsWithSource } from 'lib/permissions/pages/includePagePermissionsWithSource';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishBountyEvent } from 'lib/webhookPublisher/publishEvent';

import { countValueOccurrences } from '../utilities/numbers';

import { getBountyOrThrow } from './getBounty';

export async function rollupBountyStatus({
  bountyId,
  userId
}: {
  bountyId: string;
  userId?: string;
}): Promise<BountyWithDetails> {
  const bounty = await getBountyOrThrow(bountyId);

  // No-op on bounty suggestions. They need to be approved first
  if (bounty.status === 'suggestion') {
    return bounty;
  }

  function statusUpdate(newStatus: BountyStatus): Promise<BountyWithDetails> {
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
          include: includePagePermissionsWithSource()
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
  } else if (submissionSummary.complete > 0) {
    const updatedBounty = await statusUpdate('complete');
    // Function is sometimes called in a cron job, so userId is not always available
    if (userId) {
      await publishBountyEvent({
        scope: WebhookEventNames.RewardCompleted,
        bountyId: bounty.id,
        spaceId: bounty.page.spaceId,
        userId
      });
    }

    return updatedBounty;
  } else if (submissionSummary.paid === bounty.maxSubmissions) {
    return statusUpdate('paid');
  }

  return bounty;
}
