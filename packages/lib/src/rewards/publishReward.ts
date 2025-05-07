import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/utils/errors';

import { getRewardOrThrow } from './getReward';
import { getRewardErrors } from './getRewardErrors';

export async function publishReward(rewardId: string) {
  const { status, chainId, spaceId, rewardToken, rewardAmount, rewardType, customReward, permissions } =
    await prisma.bounty.findUniqueOrThrow({
      where: {
        id: rewardId
      },
      select: {
        spaceId: true,
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
      id: true,
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

  await prisma.$transaction([
    prisma.bounty.update({
      where: {
        id: rewardId
      },
      data: {
        status: 'open'
      }
    }),
    prisma.pagePermission.create({
      data: {
        pageId: page.id,
        permissionLevel: 'view',
        spaceId
      }
    })
  ]);

  const reward = await getRewardOrThrow({ rewardId });
  return reward;
}
