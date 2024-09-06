import { prisma } from '@charmverse/core/prisma-client';
import { roundNumberInRange } from '@root/lib/utils/numbers';

import type { ConnectWaitlistTier, TierChange } from './constants';
import { waitlistTiers } from './constants';
import { getTierChange } from './refreshPercentilesForEveryone';

/** 100th percentile is best (lowest score) */
export async function calculateUserPosition({
  fid
}: {
  fid: number;
}): Promise<{ rank: number; percentile: number; tier: ConnectWaitlistTier; score: number; tierChange: TierChange }> {
  // Fetch user and their current score and previous percentile
  const connectWaitlistSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
    where: {
      fid
    },
    select: {
      score: true,
      percentile: true // Fetch the last stored percentile
    }
  });

  // Get total number of users
  const totalWaitlistSlots = await prisma.connectWaitlistSlot.count();

  // Count how many users have a better (lower) score
  const betterScores = await prisma.connectWaitlistSlot.count({
    where: {
      score: {
        lt: connectWaitlistSlot.score
      }
    }
  });

  // Calculate the user's rank and percentile
  const rank = betterScores + 1; // Add 1 to account for the current user
  const currentPercentile = roundNumberInRange({
    num: ((totalWaitlistSlots - rank) / totalWaitlistSlots) * 100,
    min: 0,
    max: 100
  });

  // Check if the percentile has changed significantly (e.g., by 1%)
  const previousPercentile = connectWaitlistSlot.percentile ?? 0; // Default to 0 if not set

  const { tierChange, currentTier } = getTierChange({
    previousPercentile,
    currentPercentile
  });

  if (currentPercentile !== previousPercentile) {
    // Update the user's previous percentile in the database
    await prisma.connectWaitlistSlot.update({
      where: { fid },
      data: { percentile: currentPercentile }
    });
  }

  // Return the new rank and percentile
  return {
    rank,
    // Lowest percentile is 1, highest is 100
    percentile: currentPercentile,
    tier: currentTier,
    score: connectWaitlistSlot.score,
    tierChange
  };
}
