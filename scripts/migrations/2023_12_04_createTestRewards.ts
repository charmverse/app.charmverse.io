import { prisma } from '@charmverse/core/prisma-client';
import { upsertDefaultRewardsBoard } from 'lib/rewards/blocks/upsertDefaultRewardsBoard';
import { createTestReward } from 'lib/rewards/createTestReward';

export async function createTestRewards() {
  const spaces = await prisma.space.findMany({
    select: {
      id: true,
      createdBy: true,
      bounties: {
        select: {
          id: true
        },
        take: 1
      }
    }
  })

  for (const space of spaces) {
    if (space.bounties.length > 0) {
      continue;
    }

    await createTestReward({
      spaceId: space.id,
      userId: space.createdBy
    })

    await upsertDefaultRewardsBoard({ spaceId: space.id, userId: space.createdBy });
  }
}

createTestRewards();