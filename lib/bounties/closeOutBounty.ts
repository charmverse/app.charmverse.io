import { prisma } from 'db';
import { countValidSubmissions } from 'lib/applications/shared';
import type { BountyWithDetails } from 'lib/bounties';
import { includePagePermissions } from 'lib/pages/server';

import { getBountyOrThrow } from './getBounty';

export async function closeOutBounty (bountyId: string): Promise<BountyWithDetails> {

  const bounty = await getBountyOrThrow(bountyId);

  const validSubmissions = countValidSubmissions(bounty.applications);

  const applicationsToReject = bounty.applications.filter(app => {
    return app.status === 'inProgress' || app.status === 'review';
  }).map(app => app.id);

  await prisma.application.updateMany({
    where: {
      OR: applicationsToReject.map(appId => {
        return { id: appId };
      })
    },
    data: {
      status: 'rejected'
    }
  });

  const validSubmissionsAfterUpdate = validSubmissions - applicationsToReject.length;

  return prisma.bounty.update({
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
        include: includePagePermissions()
      }
    }
  }) as Promise<BountyWithDetails>;
}
