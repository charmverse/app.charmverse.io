import { prisma } from '@charmverse/core/prisma-client';

import { countValidSubmissions } from 'lib/applications/shared';
import type { BountyWithDetails } from 'lib/bounties';
import { includePagePermissionsWithSource } from 'lib/permissions/pages/includePagePermissionsWithSource';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishBountyEvent } from 'lib/webhookPublisher/publishEvent';

import { getBountyOrThrow } from './getBounty';

export async function closeOutBounty({
  bountyId,
  userId
}: {
  bountyId: string;
  userId: string;
}): Promise<BountyWithDetails> {
  const bounty = await getBountyOrThrow(bountyId);

  const validSubmissions = countValidSubmissions(bounty.applications);

  const applicationsToReject = bounty.applications
    .filter((app) => {
      return app.status === 'inProgress' || app.status === 'review';
    })
    .map((app) => app.id);

  await prisma.application.updateMany({
    where: {
      OR: applicationsToReject.map((appId) => {
        return { id: appId };
      })
    },
    data: {
      status: 'rejected'
    }
  });

  const validSubmissionsAfterUpdate = validSubmissions - applicationsToReject.length;

  const updatedBounty = await prisma.bounty.update({
    where: {
      id: bounty.id
    },
    data: {
      status: 'complete',
      maxSubmissions: validSubmissionsAfterUpdate
    },
    include: {
      applications: true,
      page: {
        include: includePagePermissionsWithSource()
      }
    }
  });

  await publishBountyEvent({
    scope: WebhookEventNames.RewardCompleted,
    bountyId: bounty.id,
    spaceId: bounty.page.spaceId,
    userId
  });

  return updatedBounty as BountyWithDetails;
}
