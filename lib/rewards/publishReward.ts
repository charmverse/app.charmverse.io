import { prisma } from '@charmverse/core/prisma-client';

import { InvalidInputError } from 'lib/utils/errors';

import { getRewardOrThrow } from './getReward';
import { getRewardErrors } from './getRewardErrors';
import { getRewardType } from './getRewardType';
import { updateRewardSettings, type UpdateableRewardFields } from './updateRewardSettings';

export type RewardPublishData = UpdateableRewardFields & {
  rewardId: string;
};

export async function publishReward(props: RewardPublishData) {
  const {
    rewardId,
    chainId = 1,
    rewardAmount,
    rewardToken,
    customReward = null,
    reviewers,
    assignedSubmitters
  } = props;

  const rewardType = getRewardType({ rewardAmount, rewardToken, chainId, customReward });
  const page = await prisma.page.findFirstOrThrow({
    where: {
      bountyId: rewardId
    },
    select: {
      type: true,
      title: true
    }
  });

  const errors = getRewardErrors({
    page,
    reward: { assignedSubmitters, rewardAmount, rewardToken, chainId, customReward, reviewers },
    rewardType
  });
  if (errors.length > 0) {
    throw new InvalidInputError(errors.join(', '));
  }

  await updateRewardSettings({
    rewardId,
    isPublished: true,
    updateContent: {
      ...props,
      rewardType
    }
  });

  const reward = await getRewardOrThrow({ rewardId });
  return reward;
}
