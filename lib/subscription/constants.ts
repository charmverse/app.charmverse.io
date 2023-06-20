import type { SubscriptionTier } from '@charmverse/core/prisma-client';

import { isProdEnv } from 'config/constants';

// Stripe Constants

export const SUBSCRIPTION_PRODUCT_IDS = [
  'community_5k',
  'community_10k',
  'community_25k',
  'community_50k',
  'community_100k'
] as const;
export type SubscriptionProductId = (typeof SUBSCRIPTION_PRODUCT_IDS)[number];

export type SubscriptionPeriod = 'monthly' | 'annual';

export const SUBSCRIPTION_PRODUCTS_RECORD: Record<
  SubscriptionProductId,
  {
    id: string;
    name: string;
    tier: SubscriptionTier;
    blockLimit: number;
    monthlyActiveUserLimit: number;
    guestLimit: number;
    pricing: Record<SubscriptionPeriod, number>;
  }
> = {
  community_5k: {
    id: 'community_5k',
    tier: 'pro',
    name: 'CharmVerse Community: 5,000 blocks',
    guestLimit: 25,
    blockLimit: 5000,
    monthlyActiveUserLimit: 25,
    pricing: {
      annual: 8,
      monthly: 10
    }
  },
  community_10k: {
    id: 'community_10k',
    tier: 'pro',
    name: 'CharmVerse Community: 10,000 blocks',
    guestLimit: 50,
    blockLimit: 10000,
    monthlyActiveUserLimit: 50,
    pricing: {
      annual: 16,
      monthly: 20
    }
  },
  community_25k: {
    id: 'community_25k',
    tier: 'pro',
    name: 'CharmVerse Community: 25,000 blocks',
    guestLimit: 75,
    blockLimit: 25000,
    monthlyActiveUserLimit: 75,
    pricing: {
      annual: 24,
      monthly: 30
    }
  },
  community_50k: {
    id: 'community_50k',
    tier: 'pro',
    name: 'CharmVerse Community: 50,000 blocks',
    guestLimit: 100,
    blockLimit: 50000,
    monthlyActiveUserLimit: 100,
    pricing: {
      annual: 32,
      monthly: 40
    }
  },
  community_100k: {
    id: 'community_100k',
    tier: 'pro',
    name: 'CharmVerse Community: 100,000 blocks',
    guestLimit: 150,
    blockLimit: 100000,
    monthlyActiveUserLimit: 150,
    pricing: {
      annual: 40,
      monthly: 50
    }
  }
};

// Loop constants

export const loopCheckoutUrl = isProdEnv ? 'https://checkout.loopcrypto.xyz' : 'https://demo.checkout.loopcrypto.xyz';
export const loopApiUrl = isProdEnv ? 'https://api.loopcrypto.xyz' : 'https://demo.api.loopcrypto.xyz';
