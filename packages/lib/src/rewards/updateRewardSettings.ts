import type { Bounty as Reward } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@packages/core/utilities';
import { InvalidInputError, PositiveNumbersOnlyError } from '@packages/utils/errors';

import { countRemainingSubmissionSlots } from './countRemainingSubmissionSlots';
import type { RewardReviewer, RewardWithUsers } from './interfaces';
import { setRewardUsers } from './setRewardUsers';

export type UpdateableRewardFields = Partial<
  Pick<
    Reward,
    | 'chainId'
    | 'rewardAmount'
    | 'rewardToken'
    | 'rewardType'
    | 'approveSubmitters'
    | 'allowMultipleApplications'
    | 'maxSubmissions'
    | 'dueDate'
    | 'customReward'
    | 'fields'
    | 'selectedCredentialTemplates'
    | 'fields'
  >
> & {
  reviewers?: RewardReviewer[];
  allowedSubmitterRoles?: string[] | null;
  assignedSubmitters?: string[] | null;
};

export type RewardUpdate = {
  rewardId: string;
  updateContent: UpdateableRewardFields;
};

export async function updateRewardSettings({
  rewardId,
  updateContent,
  isPublished
}: RewardUpdate & { isPublished?: boolean }): Promise<RewardWithUsers> {
  if (!stringUtils.isUUID(rewardId)) {
    throw new InvalidInputError(`Valid reward id is required`);
  }

  if (typeof updateContent.rewardAmount === 'number' && updateContent.rewardAmount <= 0) {
    throw new PositiveNumbersOnlyError();
  }

  const reward = await prisma.bounty.findUniqueOrThrow({
    where: {
      id: rewardId
    },
    select: {
      status: true,
      maxSubmissions: true,
      applications: {
        select: {
          status: true
        }
      }
    }
  });

  const remaining = countRemainingSubmissionSlots({
    applications: reward.applications,
    limit: updateContent.maxSubmissions ?? reward.maxSubmissions
  }) as number;
  if (typeof remaining === 'number' && typeof updateContent.maxSubmissions === 'number' && remaining <= 0) {
    throw new InvalidInputError('New reward cap cannot be lower than total of active and valid submissions.');
  }

  const isAssignedReward = !!updateContent.assignedSubmitters && !!updateContent.assignedSubmitters?.length;

  const updatedReward = await prisma.$transaction(async (tx) => {
    await tx.bounty.update({
      where: {
        id: rewardId
      },
      data: {
        status: isPublished ? 'open' : reward.status,
        customReward: updateContent.customReward,
        updatedAt: new Date(),
        dueDate: updateContent.dueDate,
        chainId: updateContent.chainId,
        rewardAmount: updateContent.rewardAmount,
        rewardToken: updateContent.rewardToken,
        rewardType: updateContent.rewardType,
        allowMultipleApplications: isAssignedReward ? false : updateContent.allowMultipleApplications,
        approveSubmitters: isAssignedReward ? false : updateContent.approveSubmitters,
        maxSubmissions: isAssignedReward ? 1 : updateContent.maxSubmissions,
        fields: updateContent.fields as any,
        selectedCredentialTemplates: updateContent.selectedCredentialTemplates
      },
      select: { id: true }
    });

    const rewardAfterUpdate = await setRewardUsers({
      rewardId,
      users: {
        allowedSubmitterRoles: updateContent.allowedSubmitterRoles,
        reviewers: updateContent.reviewers,
        assignedSubmitters: updateContent.assignedSubmitters
      },
      tx
    });

    return rewardAfterUpdate;
  });

  return updatedReward;
}
