import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { roundNumberInRange } from '@root/lib/utils/numbers';

import type { ConnectWaitlistTier, TierChange, TierDistributionType } from './constants';
import { tierDistribution, getTier } from './constants';
import { notifyNewScore } from './notifyNewScore';

export type TierChangeResult = {
  fid: number;
  newTier: ConnectWaitlistTier;
  tierChange: TierChange;
  percentile: number;
  score: number;
};

const tierOrder: ConnectWaitlistTier[] = ['legendary', 'mythic', 'epic', 'rare', 'common'];

export function getTierChange({
  previousPercentile,
  currentPercentile
}: {
  previousPercentile: number;
  currentPercentile: number;
}): { previousTier: ConnectWaitlistTier; currentTier: ConnectWaitlistTier; tierChange: TierChange } {
  const previousTier = getTier(previousPercentile);
  const currentTier = getTier(currentPercentile);

  return {
    previousTier,
    currentTier,
    tierChange: previousTier === currentTier ? 'none' : previousPercentile < currentPercentile ? 'up' : 'down'
  };
}

export async function refreshPercentilesForEveryone(): Promise<TierChangeResult[]> {
  const totalUsers = await prisma.connectWaitlistSlot.count();
  const onePercentSize = Math.max(totalUsers / 100, 1);
  const tierChangeResults: TierChangeResult[] = [];

  let offset = 0;

  for (const tier of tierOrder) {
    const tierInfo = tierDistribution.find((t) => t.tier === tier) as TierDistributionType;
    const take = tierInfo.tier === 'common' ? undefined : Math.ceil(tierInfo.totalPercentSize * onePercentSize);

    const users = await prisma.connectWaitlistSlot.findMany({
      orderBy: { score: 'asc' },
      skip: offset,
      take
    });

    // Group users by percentile
    const usersByPercentile: { [percentile: number]: number[] } = {};

    for (let i = 0; i < users.length; i++) {
      // We need an adjust min max as otherwise we get bad numbers for very small ranges
      const currentPercentile = roundNumberInRange({
        num: 100 - ((offset + i + 1) / totalUsers) * 100,
        max: tierInfo.threshold + tierInfo.totalPercentSize - 1,
        min: tierInfo.threshold
      });

      const previousPercentile = users[i].percentile ?? 0;

      // Only consider users whose percentile has changed
      if (currentPercentile !== previousPercentile) {
        if (!usersByPercentile[currentPercentile]) {
          usersByPercentile[currentPercentile] = [];
        }
        usersByPercentile[currentPercentile].push(users[i].fid);

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
      }
    }

    // Batch update for each percentile group, but only if there are users in that group
    for (const [percentile, fids] of Object.entries(usersByPercentile)) {
      if (fids.length > 0) {
        await prisma.connectWaitlistSlot.updateMany({
          where: { fid: { in: fids.map((fid) => Number(fid)) } },
          data: { percentile: Number(percentile) }
        });
      }
    }

    offset += users.length;
  }

  return tierChangeResults;
}

export function handleTierChanges(tierChangeResults: TierChangeResult[]) {
  return tierChangeResults.map((tierChangeResult) =>
    notifyNewScore({
      fid: tierChangeResult.fid,
      tier: tierChangeResult.newTier,
      tierChange: tierChangeResult.tierChange
    }).catch((error) => {
      log.error(`Failed to notify tier change for fid:${tierChangeResult.fid}`, { error, fid: tierChangeResult.fid });
    })
  );
}
