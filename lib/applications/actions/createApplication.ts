import type { Application } from '@prisma/client';

import { prisma } from 'db';
import { getBountyOrThrow } from 'lib/bounties';
import { DuplicateDataError, LimitReachedError, StringTooShortError } from 'lib/utilities/errors';

import type { ApplicationCreationData } from '../interfaces';
import { MINIMUM_APPLICATION_MESSAGE_CHARACTERS, submissionsCapReached } from '../shared';

export async function createApplication ({ bountyId, message, userId, status = 'applied' }: ApplicationCreationData): Promise<Application> {
  const bounty = await getBountyOrThrow(bountyId);

  const existingApplication = bounty.applications.find(app => app.createdBy === userId);

  if (existingApplication) {
    throw new DuplicateDataError('You have already applied to this bounty');
  }

  if (!message || message.length < MINIMUM_APPLICATION_MESSAGE_CHARACTERS) {
    throw new StringTooShortError();
  }

  const capReached = submissionsCapReached({ bounty, submissions: bounty.applications });

  if (capReached) {
    throw new LimitReachedError(`The submissions cap of ${bounty.maxSubmissions} submission${bounty.maxSubmissions !== 1 ? 's' : ''} has been reached for this bounty.`);
  }

  return prisma.application.create({
    data: {
      status,
      message,
      applicant: {
        connect: {
          id: userId
        }
      },
      bounty: {
        connect: {
          id: bountyId
        }
      },
      spaceId: bounty.spaceId
    }
  });
}
