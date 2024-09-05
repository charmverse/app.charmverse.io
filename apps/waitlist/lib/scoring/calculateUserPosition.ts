import { prisma } from '@charmverse/core/prisma-client';
import { roundNumberInRange } from '@root/lib/utils/numbers';

export const waitlistTiers = ['legendary', 'mythic', 'epic', 'rare', 'common'] as const;

export type ConnectWaitlistTier = (typeof waitlistTiers)[number];

export type TierChange = 'none' | 'up' | 'down';

type TierDistributionType = {
  tier: ConnectWaitlistTier;
  threshold: number;
  totalPercentSize: number;
  imageText: string;
  badge: string;
  badgeText: string;
};

export const tierDistribution: TierDistributionType[] = [
  {
    tier: 'common',
    threshold: 1,
    totalPercentSize: 40,
    imageText: '/images/levels/common.png',
    badge: '/images/levels/common-badge.png',
    badgeText: '/images/levels/common-badge-text.png'
  },
  {
    tier: 'rare',
    threshold: 30,
    totalPercentSize: 20,
    imageText: '/images/levels/rare.png',
    badge: '/images/levels/rare-badge.png',
    badgeText: '/images/levels/rare-badge-text.png'
  },
  {
    tier: 'epic',
    threshold: 60,
    totalPercentSize: 20,
    imageText: '/images/levels/epic.png',
    badge: '/images/levels/epic-badge.png',
    badgeText: '/images/levels/epic-badge-text.png'
  },
  {
    tier: 'mythic',
    threshold: 80,
    totalPercentSize: 15,
    imageText: '/images/levels/mythic.png',
    badge: '/images/levels/mythic-badge.png',
    badgeText: '/images/levels/mythic-badge-text.png'
  },
  {
    tier: 'legendary',
    threshold: 95,
    totalPercentSize: 5,
    imageText: '/images/levels/legendary.png',
    badge: '/images/levels/legendary-badge.png',
    badgeText: '/images/levels/legendary-badge-text.png'
  }
];
export const tierDistributionMap = tierDistribution.reduce<Record<ConnectWaitlistTier, TierDistributionType>>(
  (acc, item) => {
    acc[item.tier] = item;
    return acc;
  },
  {} as Record<ConnectWaitlistTier, TierDistributionType>
);

export function getTier(percentile?: number | null): ConnectWaitlistTier {
  if (!percentile) {
    return 'common';
  }
  return tierDistribution.find(({ threshold }) => percentile >= threshold)?.tier || 'common';
}

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
