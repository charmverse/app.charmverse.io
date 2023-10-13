import type { Application, ApplicationStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { LimitReachedError, StringTooShortError, WrongStateError } from 'lib/utilities/errors';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishBountyEvent } from 'lib/webhookPublisher/publishEvent';

import { countRemainingSubmissionSlots } from './countRemainingSubmissionSlots';
import { getRewardOrThrow } from './getReward';

export type ApplicationCreationData = { userId: string; rewardId: string } & Partial<{
  message: string;
  submission?: string;
  submissionNodes?: any;
}>;

export async function createApplication({
  rewardId,
  message,
  userId,
  submission,
  submissionNodes
}: ApplicationCreationData): Promise<Application> {
  const reward = await getRewardOrThrow({ rewardId });

  const capReached =
    reward.maxSubmissions &&
    (countRemainingSubmissionSlots({ applications: reward.applications, limit: reward.maxSubmissions }) as number) <= 0;

  if (capReached) {
    throw new LimitReachedError(
      `The submissions cap of ${reward.maxSubmissions} submission${
        reward.maxSubmissions !== 1 ? 's' : ''
      } has been reached for this bounty.`
    );
  } else if (reward.status !== 'open' && reward.status !== 'inProgress') {
    throw new WrongStateError('Cannot apply to a closed reward');
  }

  // Check if submissionNodes is a JSON object and stringify if necessary
  // This is a holdover from the first implementation, where we defined this field as string type
  const submissionNodesAsString =
    typeof submissionNodes === 'object' ? JSON.stringify(submissionNodes) : (submissionNodes as string);

  const applicationOrSubmission = await prisma.application.create({
    data: {
      status: reward.approveSubmitters ? 'applied' : 'inProgress',
      submission,
      submissionNodes: submissionNodesAsString,
      message,
      applicant: {
        connect: {
          id: userId
        }
      },
      bounty: {
        connect: {
          id: rewardId
        }
      },
      spaceId: reward.spaceId
    }
  });

  await publishBountyEvent({
    scope: WebhookEventNames.RewardApplicationCreated,
    bountyId: rewardId,
    spaceId: reward.spaceId,
    applicationId: applicationOrSubmission.id
  });

  return applicationOrSubmission;
}
