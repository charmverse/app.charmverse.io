import { prisma } from '@charmverse/core/prisma-client';
import { upsertBlock as upsertRewardBlock } from 'lib/rewards/blocks/upsertBlock';
import { upsertDefaultRewardsBoard } from 'lib/rewards/blocks/upsertDefaultRewardsBoard';

export async function migrateRewardBoardViews() {
  const spaces = await prisma.space.findMany({
    where: {
      bounties: {
        some: {}
      }
    }
  });

  console.log('🔥', 'Spaces to migrate boards:', spaces.length);

  let i = 1;
  for (const space of spaces) {
    console.log('🔥', `Migrating no: ${i}`);

    await upsertDefaultRewardsBoard({
      spaceId: space.id
    });

    i++;
  }
}

migrateRewardBoardViews();
