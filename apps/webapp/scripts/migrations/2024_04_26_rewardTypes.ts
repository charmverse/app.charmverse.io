import { prisma } from '@charmverse/core/prisma-client';

import { getRewardType } from 'lib/rewards/getRewardType';

async function convertCharmEditorApplicationInput() {
  const bounties = await prisma.bounty.findMany({
    where: {
      rewardType: 'none'
    }
  });

  const total = bounties.length;
  let current = 0;

  const counts: Record<string, number> = {};
  console.log('processing rewards', total);

  for (const reward of bounties) {
    current++;
    const rewardType = getRewardType(reward);
    counts[rewardType] = (counts[rewardType] || 0) + 1;
    await prisma.bounty.update({
      where: {
        id: reward.id
      },
      data: {
        rewardType
      }
    });
    if (current % 100 === 0)
      console.log(`Processed ${current} of ${total} applications`, JSON.stringify(counts, null, 2));
  }
  console.log(`Processed ${current} of ${total} applications`, JSON.stringify(counts, null, 2));
}

convertCharmEditorApplicationInput().then(() => console.log('Done!'));
