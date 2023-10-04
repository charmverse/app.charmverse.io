import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { DataNotFoundError } from 'lib/utilities/errors';

import type { RewardWithUsers } from './interfaces';
import { mapDbRewardToReward } from './mapDbRewardToReward';

export function rewardWithUsersInclude() {
  return {
    applications: {
      select: {
        id: true,
        createdBy: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    },
    permissions: {
      select: {
        userId: true,
        roleId: true,
        permissionLevel: true
      }
    }
  };
}

export async function getReward({
  rewardId,
  tx = prisma
}: {
  tx?: Prisma.TransactionClient;
  rewardId: string;
}): Promise<RewardWithUsers | null> {
  return tx.bounty
    .findUnique({
      where: {
        id: rewardId
      },
      include: rewardWithUsersInclude()
    })
    .then((reward) => {
      if (!reward) {
        return null;
      }

      return mapDbRewardToReward(reward);
    });
}

export async function getRewardOrThrow({
  rewardId,
  tx = prisma
}: {
  tx?: Prisma.TransactionClient;
  rewardId: string;
}): Promise<RewardWithUsers> {
  const reward = await getReward({ rewardId, tx });
  if (!reward) {
    throw new DataNotFoundError(`Reward with id ${rewardId} not found`);
  }
  return reward;
}
