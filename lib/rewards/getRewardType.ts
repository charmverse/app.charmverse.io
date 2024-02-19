import type { Bounty } from '@charmverse/core/prisma';

import type { RewardType } from './interfaces';

// TODO: this should be stored on the reward table
export function getRewardType(
  reward: Pick<Bounty, 'chainId' | 'customReward' | 'rewardToken' | 'rewardAmount'>
): RewardType {
  return reward.customReward
    ? 'custom'
    : reward.chainId && reward.rewardToken && reward.rewardAmount
    ? 'token'
    : 'none';
}
