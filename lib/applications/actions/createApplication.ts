import type { Application } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { countRemainingSubmissionSlots } from 'lib/rewards/countRemainingSubmissionSlots';
import { getRewardOrThrow } from 'lib/rewards/getReward';
import { DuplicateDataError, LimitReachedError, StringTooShortError } from 'lib/utilities/errors';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishBountyEvent } from 'lib/webhookPublisher/publishEvent';

import type { ApplicationCreationData } from '../interfaces';

export async function createApplication({
  bountyId,
  message,
  userId,
  status = 'applied'
}: ApplicationCreationData): Promise<Application> {
  const reward = await getRewardOrThrow({ rewardId: bountyId });

  const existingApplication = reward.applications.find((app) => app.createdBy === userId);

  if (existingApplication) {
    throw new DuplicateDataError('You have already applied to this bounty');
  }

  if (typeof message !== 'string' && !message) {
    throw new StringTooShortError();
  }

  const capReached =
    reward.maxSubmissions &&
    (countRemainingSubmissionSlots({ applications: reward.applications, limit: reward.maxSubmissions }) as number) <= 0;

  if (capReached) {
    throw new LimitReachedError(
      `The submissions cap of ${reward.maxSubmissions} submission${
        reward.maxSubmissions !== 1 ? 's' : ''
      } has been reached for this bounty.`
    );
  }

  const application = await prisma.application.create({
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
      spaceId: reward.spaceId
    }
  });

  await publishBountyEvent({
    scope: WebhookEventNames.RewardApplicationCreated,
    bountyId,
    spaceId: reward.spaceId,
    applicationId: application.id
  });

  return application;
}
