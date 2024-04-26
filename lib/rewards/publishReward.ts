import { prisma } from '@charmverse/core/prisma-client';

import { InvalidInputError } from 'lib/utils/errors';

import { getRewardOrThrow } from './getReward';
import { getRewardErrors } from './getRewardErrors';
import { getRewardType } from './getRewardType';

export async function publishReward(rewardId: string) {
  const { status, chainId, rewardToken, rewardAmount, rewardType, customReward, permissions } =
    await prisma.bounty.findUniqueOrThrow({
      where: {
        id: rewardId
      },
      select: {
        status: true,
        rewardAmount: true,
        rewardToken: true,
        rewardType: true,
        chainId: true,
        customReward: true,
        permissions: {
          where: {
            permissionLevel: 'reviewer'
          }
        }
      }
    });

  if (status !== 'draft') {
    throw new InvalidInputError('Reward is not in draft state.');
  }

  const reviewers = permissions.map((permission) => permission);
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
    reward: { rewardAmount, rewardToken, chainId, customReward, reviewers },
    rewardType
  });

  if (errors.length > 0) {
    throw new InvalidInputError(errors.join(', '));
  }

  await prisma.bounty.update({
    where: {
      id: rewardId
    },
    data: {
      status: 'open'
    }
  });

  const reward = await getRewardOrThrow({ rewardId });
  return reward;
}
