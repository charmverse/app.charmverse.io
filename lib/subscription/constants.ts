export const SUBSCRIPTION_USAGE = [1, 2, 3, 4, 5] as const;
export type SubscriptionUsage = (typeof SUBSCRIPTION_USAGE)[number];

export type SubscriptionPeriod = 'monthly' | 'annual';

export const SUBSCRIPTION_USAGE_RECORD: Record<
  SubscriptionUsage,
  {
    totalBlocks: number;
    totalActiveUsers: number;
    pricing: Record<SubscriptionPeriod, number>;
  }
> = {
  '1': {
    totalBlocks: 5000,
    totalActiveUsers: 25,
    pricing: {
      annual: 8,
      monthly: 10
    }
  },
  '2': {
    totalBlocks: 10000,
    totalActiveUsers: 35,
    pricing: {
      annual: 18,
      monthly: 20
    }
  },
  '3': {
    totalBlocks: 25000,
    totalActiveUsers: 50,
    pricing: {
      annual: 28,
      monthly: 30
    }
  },
  '4': {
    totalBlocks: 35000,
    totalActiveUsers: 75,
    pricing: {
      annual: 38,
      monthly: 40
    }
  },
  '5': {
    totalBlocks: 100000,
    totalActiveUsers: 100,
    pricing: {
      annual: 48,
      monthly: 50
    }
  }
};
