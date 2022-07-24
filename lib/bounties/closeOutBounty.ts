import { prisma } from 'db';
import { countValidSubmissions } from 'lib/applications/shared';
import { BountyWithDetails } from '../../models/Bounty';
import { DataNotFoundError } from '../utilities/errors';
import { getBounty } from './getBounty';

export async function closeOutBounty (bountyId: string): Promise<BountyWithDetails> {
  const bounty = await getBounty(bountyId);
  if (!bounty) {
    throw new DataNotFoundError(`Bounty with ID ${bountyId} not found`);
  }

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
      page: true
    }
  });

  return updatedBounty;

}
