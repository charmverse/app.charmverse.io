import type { Application, Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { InvalidStateError } from '@packages/nextjs/errors';
import { DuplicateDataError, InvalidInputError, LimitReachedError, WrongStateError } from '@packages/utils/errors';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';
import { publishBountyEvent } from '@packages/lib/webhookPublisher/publishEvent';

import { countRemainingSubmissionSlots } from './countRemainingSubmissionSlots';
import { getRewardOrThrow } from './getReward';
import { statusesAcceptingNewWork } from './shared';

export type WorkUpsertData = { userId: string; rewardId: string; applicationId?: string } & Partial<
  Pick<Application, 'message' | 'messageNodes' | 'submission' | 'submissionNodes' | 'walletAddress' | 'rewardInfo'>
>;

/**
 * Once a user has created a piece of work, it is always editable
 * @param param0
 * @returns
 */
export async function work({
  rewardId,
  message,
  messageNodes,
  userId,
  submission,
  submissionNodes,
  applicationId,
  rewardInfo,
  walletAddress
}: WorkUpsertData): Promise<Application> {
  if (!stringUtils.isUUID(userId)) {
    throw new InvalidInputError(`User id is invalid: ${userId}`);
  }

  const reward = await getRewardOrThrow({ rewardId });

  if (reward.status === 'draft') {
    throw new InvalidStateError(`Cannot apply to a draft reward`);
  }

  const userApplications = reward.applications.filter((a) => a.createdBy === userId);

  const userHasExistingApplication = !!userApplications.length;

  if (applicationId) {
    if (!stringUtils.isUUID(applicationId)) {
      throw new InvalidInputError(`Invalid application id: ${applicationId}`);
    } else if (!userApplications.some((app) => app.id === applicationId)) {
      throw new InvalidInputError(`You cannot update another users work`);
    }
  } else if (!applicationId && userHasExistingApplication && !reward.allowMultipleApplications) {
    throw new DuplicateDataError(`You cannot apply twice to work on this reward`);
  } else if (!applicationId && !statusesAcceptingNewWork.includes(reward.status)) {
    throw new WrongStateError(
      `This reward is not accepting new ${reward.approveSubmitters ? 'applications' : 'submissions'}`
    );
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
  } else if (reward.status !== 'open' && !applicationId) {
    throw new WrongStateError('Cannot create new applicaton on a closed reward');
  }

  const submissionNodesAsString =
    typeof submissionNodes === 'object' ? JSON.stringify(submissionNodes) : (submissionNodes as string);

  const updateableFields: Prisma.ApplicationUpdateInput = {
    submission,
    submissionNodes: submissionNodesAsString,
    rewardInfo,
    message,
    messageNodes: messageNodes as Prisma.JsonObject,
    walletAddress
  };

  const rewardCreateInput: Prisma.ApplicationCreateInput = {
    ...(updateableFields as any),
    status: reward.approveSubmitters ? 'applied' : 'review',
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
    const existingApp = reward.applications.find((app) => app.id === applicationId);

    applicationOrSubmission = await prisma.application.update({
      where: {
        id: applicationId
      },
      data: {
        ...updateableFields,
        // If the reward requires applications, user will be moved to "in progress" when application is approved. Once they are submitting content, they will be moved to "review"
        status: updateableFields.submissionNodes && existingApp?.status === 'inProgress' ? 'review' : undefined
      }
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
