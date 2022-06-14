import { Application } from '@prisma/client';
import { DataNotFoundError, LimitReachedError, UnauthorisedActionError } from 'lib/utilities/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { prisma } from 'db';
import { getBounty } from 'lib/bounties';
import { ApplicationActionRequest } from '../interfaces';
import { getApplication } from '../getApplication';
import { submissionsCapReached } from '../shared';
import { BountyWithDetails } from '../../../models';

export async function approveApplication ({ applicationOrApplicationId, userId }: ApplicationActionRequest): Promise<Application> {
  const application = await getApplication(typeof applicationOrApplicationId === 'string' ? applicationOrApplicationId : applicationOrApplicationId.id);

  if (!application) {
    throw new DataNotFoundError(`Application with id ${applicationOrApplicationId} was not found`);
  }

  // Check the requester has access to this space
  const { error, isAdmin } = await hasAccessToSpace({ userId, spaceId: application.bounty.spaceId, adminOnly: false });

  if (error) {
    throw error;
  }

  // Admin or reviewer can assign the application
  if (isAdmin === false && application.bounty.reviewer !== userId) {
    throw new UnauthorisedActionError('You do not have permissions to approve this application');
  }

  const bounty = await getBounty(application.bountyId) as BountyWithDetails;

  const capReached = submissionsCapReached({ bounty, submissions: bounty.applications });

  if (capReached) {
    throw new LimitReachedError(`This application cannot be approved as the limit of active submissions of ${bounty.maxSubmissions} has been reached.`);
  }

  const updated = await prisma.application.update({
    where: {
      id: application.id
    },
    data: {
      status: 'inProgress'
    }
  }) as Application;

  return updated;
}
