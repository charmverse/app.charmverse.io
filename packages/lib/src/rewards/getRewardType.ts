import type { Bounty } from '@charmverse/core/prisma';

import type { RewardType } from './interfaces';

// TODO: this should be stored on the reward table
// If it is a new reward and not using a template, use Token
// If neither rewardToken nor customReward is set, use None
export function getRewardType(
  reward: Partial<Pick<Bounty, 'chainId' | 'customReward' | 'rewardToken' | 'rewardAmount'>>,
  isNewReward?: boolean,
  isFromTemplate?: boolean
): RewardType {
  return reward.customReward
    ? 'custom'
    : reward.rewardToken
      ? 'token'
      : isNewReward && !isFromTemplate
        ? 'token'
        : 'none';
}
