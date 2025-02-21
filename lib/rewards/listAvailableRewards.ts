import { prisma } from '@charmverse/core/prisma-client';

import { DataNotFoundError } from '../../packages/utils/src/errors';
import type { AvailableResourcesRequest } from '../permissions/interfaces';

import { rewardWithUsersInclude } from './getReward';
import type { RewardWithUsers } from './interfaces';
import { mapDbRewardToReward } from './mapDbRewardToReward';

/**
 * Free tier implementation
 */
export async function listAvailableRewards({ spaceId }: AvailableResourcesRequest): Promise<RewardWithUsers[]> {
  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    },
    select: {
      publicBountyBoard: true
    }
  });

  if (!space) {
    throw new DataNotFoundError(`Space with id ${spaceId} not found`);
  }

  return prisma.bounty
    .findMany({
      where: {
        spaceId,
        page: {
          // Prevents returning rewards from other spaces
          spaceId,
          deletedAt: null
        }
      },
      include: rewardWithUsersInclude()
    })
    .then((data) => data.map(mapDbRewardToReward)) as Promise<RewardWithUsers[]>;
}
