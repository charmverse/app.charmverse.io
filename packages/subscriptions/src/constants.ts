import type { SpaceSubscriptionTier } from '@charmverse/core/prisma';

export const subscriptionTierOrder: SpaceSubscriptionTier[] = [
  'readonly',
  'free',
  'bronze',
  'silver',
  'gold',
  'grant'
] as const;

export const tierConfig: Record<SpaceSubscriptionTier, { name: string; iconPath: string; tokenPrice: number }> = {
  readonly: {
    name: 'Locked',
    tokenPrice: 0,
    iconPath: '/images/logos/dev-token-logo.png'
  },
  free: {
    name: 'Public',
    tokenPrice: 0,
    iconPath: '/images/subscriptions/public.webp'
  },
  grant: {
    name: 'Grant',
    tokenPrice: 0,
    iconPath: '/images/logos/dev-token-logo.png'
  },
  bronze: {
    name: 'Bronze',
    tokenPrice: 1, // 1_000,
    iconPath: '/images/subscriptions/bronze.svg'
  },
  silver: {
    name: 'Silver',
    tokenPrice: 1, // 2_500,
    iconPath: '/images/subscriptions/silver.svg'
  },
  gold: {
    name: 'Gold',
    tokenPrice: 1, // 10_000,
    iconPath: '/images/subscriptions/gold.svg'
  }
};
