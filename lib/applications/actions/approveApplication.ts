import type { Application } from '@prisma/client';

import { prisma } from 'db';
import { getBountyOrThrow } from 'lib/bounties/getBounty';
import { DataNotFoundError, LimitReachedError, UndesirableOperationError } from 'lib/utilities/errors';

import { getApplication } from '../getApplication';
import type { ApplicationActionRequest } from '../interfaces';
import { submissionsCapReached } from '../shared';

export async function approveApplication ({ applicationOrApplicationId, userId }: ApplicationActionRequest): Promise<Application> {
  const application = await getApplication(typeof applicationOrApplicationId === 'string' ? applicationOrApplicationId : applicationOrApplicationId.id);

  if (!application) {
    throw new DataNotFoundError(`Application with id ${applicationOrApplicationId} was not found`);
  }

  const bounty = await getBountyOrThrow(application.bountyId);

  const capReached = submissionsCapReached({ bounty, submissions: bounty.applications });

  if (application.createdBy === userId) {
    throw new UndesirableOperationError('You cannot approve your own application');
  }

  if (capReached) {
    throw new LimitReachedError(`This application cannot be approved as the limit of active submissions of ${bounty.maxSubmissions} has been reached.`);
  }

  const updated = await prisma.application.update({
    where: {
      id: application.id
    },
    data: {
      status: 'inProgress',
      acceptedBy: userId
    }
  }) as Application;

  return updated;
}
