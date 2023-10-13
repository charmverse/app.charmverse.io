import type { Application, Prisma, PrismaPromise } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { InvalidInputError, LimitReachedError, WrongStateError } from 'lib/utilities/errors';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishBountyEvent } from 'lib/webhookPublisher/publishEvent';

import { countRemainingSubmissionSlots } from './countRemainingSubmissionSlots';
import { getRewardOrThrow } from './getReward';

export type WorkUpsertData = { userId: string; rewardId: string; applicationId?: string } & Partial<
  Pick<Application, 'message' | 'submission' | 'submissionNodes' | 'walletAddress' | 'rewardInfo'>
>;

/**
 * Once a user has created a piece of work, it is always editable
 * @param param0
 * @returns
 */
export async function work({
  rewardId,
  message,
  userId,
  submission,
  submissionNodes,
  applicationId,
  rewardInfo,
  walletAddress
}: WorkUpsertData): Promise<Application> {
  const reward = await getRewardOrThrow({ rewardId });

  const userApplications = reward.applications.filter((a) => a.createdBy === userId);

  if (applicationId && !userApplications.some((app) => app.id === applicationId)) {
    throw new InvalidInputError(`You cannot update another users work`);
  }

  const capReached =
    reward.maxSubmissions &&
    (countRemainingSubmissionSlots({ applications: reward.applications, limit: reward.maxSubmissions }) as number) <= 0;

  // User didn't get an active application before the cap was reached

  if (capReached && !applicationId) {
    throw new LimitReachedError(
      `The submissions cap of ${reward.maxSubmissions} submission${
        reward.maxSubmissions !== 1 ? 's' : ''
      } has been reached for this bounty.`
    );

    // Don't allow users to create new apps
  } else if (reward.status !== 'open' && reward.status !== 'inProgress' && !applicationId) {
    throw new WrongStateError('Cannot create new applicaton on a closed reward');
  }

  const submissionNodesAsString =
    typeof submissionNodes === 'object' ? JSON.stringify(submissionNodes) : (submissionNodes as string);

  const updateableFields: Prisma.ApplicationUpdateInput = {
    submission,
    submissionNodes: submissionNodesAsString,
    rewardInfo,
    message,
    walletAddress
  };

  const rewardCreateInput: Prisma.ApplicationCreateInput = {
    ...(updateableFields as any),
    status: reward.approveSubmitters ? 'applied' : 'inProgress',
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
  };

  let applicationOrSubmission: Application;

  if (!applicationId) {
    applicationOrSubmission = await prisma.application.create({
      data: rewardCreateInput
    });
  } else {
    applicationOrSubmission = await prisma.application.update({
      where: {
        id: applicationId
      },
      data: updateableFields
    });
  }

  await publishBountyEvent({
    scope: WebhookEventNames.RewardApplicationCreated,
    bountyId: rewardId,
    spaceId: reward.spaceId,
    applicationId: applicationOrSubmission.id
  });

  return applicationOrSubmission;
}
