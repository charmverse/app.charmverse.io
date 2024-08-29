import { prisma } from '@charmverse/core/prisma-client';
import { roundNumberInRange } from '@root/lib/utils/numbers';

export const waitlistTiers = ['legendary', 'mythic', 'epic', 'rare', 'common'] as const;

export type ConnectWaitlistTier = (typeof waitlistTiers)[number];

export type TierChange = 'none' | 'up' | 'down';

const tierDistribution: { tier: ConnectWaitlistTier; threshold: number; totalPercentSize: number }[] = [
  { tier: 'legendary', threshold: 96, totalPercentSize: 5 },
  { tier: 'mythic', threshold: 81, totalPercentSize: 15 },
  { tier: 'epic', threshold: 61, totalPercentSize: 20 },
  { tier: 'rare', threshold: 41, totalPercentSize: 20 },
  { tier: 'common', threshold: 1, totalPercentSize: 40 }
];

export function getTier(percentile: number): ConnectWaitlistTier {
  return tierDistribution.find(({ threshold }) => percentile >= threshold)?.tier || 'common';
}

function getTierChange({
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
