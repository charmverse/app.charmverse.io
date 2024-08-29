import { prisma } from '@charmverse/core/prisma-client';
import { roundNumberInRange } from '@root/lib/utils/numbers';

import type { ConnectWaitlistTier, TierChange } from './calculateUserPosition';
import { tierDistribution, getTierChange } from './calculateUserPosition';

type TierChangeResult = {
  fid: number;
  newTier: ConnectWaitlistTier;
  tierChange: TierChange;
  percentile: number;
  score: number;
};

export async function refreshPercentilesForEveryone(): Promise<TierChangeResult[]> {
  const totalUsers = await prisma.connectWaitlistSlot.count();
  const onePercentSize = Math.max(totalUsers / 100, 1);
  const tierChangeResults: TierChangeResult[] = [];

  let offset = 0;

  for (const tierInfo of tierDistribution) {
    const take = tierInfo.tier === 'common' ? undefined : Math.ceil(tierInfo.totalPercentSize * onePercentSize);

    const users = await prisma.connectWaitlistSlot.findMany({
      orderBy: { score: 'asc' },
      skip: offset,
      take
    });
    for (let i = 0; i < users.length; i++) {
      const currentPercentile = roundNumberInRange({
        num: 100 - ((offset + i + 1) / totalUsers) * 100,
        max: 100,
        min: 0
      });

      const previousPercentile = users[i].percentile ?? 0;
      const { currentTier, tierChange } = getTierChange({
        previousPercentile,
        currentPercentile
      });

      if (tierChange !== 'none') {
        tierChangeResults.push({
          fid: users[i].fid,
          newTier: currentTier,
          tierChange,
          percentile: currentPercentile,
          score: users[i].score
        });
      }

      await prisma.connectWaitlistSlot.update({
        where: { fid: users[i].fid },
        data: { percentile: currentPercentile }
      });
    }

    offset += users.length;
  }
  return tierChangeResults;
}
