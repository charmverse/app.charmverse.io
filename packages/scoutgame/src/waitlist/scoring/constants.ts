export const waitlistTiers = ['legendary', 'mythic', 'epic', 'rare', 'common'] as const;

export type ConnectWaitlistTier = (typeof waitlistTiers)[number];

export type TierChange = 'none' | 'up' | 'down';

export type TierDistributionType = {
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
    totalPercentSize: 30,
    imageText: '/images/levels/common.png',
    badge: '/images/levels/common-badge.png',
    badgeText: '/images/levels/common-badge-text.png'
  },
  {
    tier: 'rare',
    threshold: 31,
    totalPercentSize: 30,
    imageText: '/images/levels/rare.png',
    badge: '/images/levels/rare-badge.png',
    badgeText: '/images/levels/rare-badge-text.png'
  },
  {
    tier: 'epic',
    threshold: 61,
    totalPercentSize: 20,
    imageText: '/images/levels/epic.png',
    badge: '/images/levels/epic-badge.png',
    badgeText: '/images/levels/epic-badge-text.png'
  },
  {
    tier: 'mythic',
    threshold: 81,
    totalPercentSize: 15,
    imageText: '/images/levels/mythic.png',
    badge: '/images/levels/mythic-badge.png',
    badgeText: '/images/levels/mythic-badge-text.png'
  },
  {
    tier: 'legendary',
    threshold: 96,
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

  const tier = findHighestNumberInArray(tierDistribution, 'threshold', percentile)?.tier || 'common';

  return tier;
}

export const tierColors: Record<ConnectWaitlistTier, string> = {
  common: '#b2bec0',
  rare: '#ecb366',
  epic: '#e79b81',
  mythic: '#dd77ea',
  legendary: '#b293f1'
};

// Find the highest number in an array of objects that is less than or equal to n
export function findHighestNumberInArray<Z extends string, T extends Record<Z, number>>(array: T[], key: Z, n: number) {
  return array.reduce<T | null>((acc, item) => {
    if (n >= item[key] && (!acc || item[key] > acc[key])) {
      return item;
    }
    return acc;
  }, null as T | null);
}

export function getWaitlistRange(tier: ConnectWaitlistTier): { min: number; max: number } {
  const tierInfo = tierDistributionMap[tier];
  if (!tierInfo) {
    throw new Error(`Invalid tier: ${tier}`);
  }

  const min = tierInfo.threshold;
  const max = min + tierInfo.totalPercentSize - 1; // Calculate max based on totalPercentSize

  return { min, max };
}
