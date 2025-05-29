import env from '@beam-australia/react-env';
import type { SpaceSubscriptionTier } from '@charmverse/core/prisma';

export const devTokenAddress = '0x047157cffb8841a64db93fd4e29fa3796b78466c';
export const uniswapSwapUrl = `https://app.uniswap.org/explore/tokens/base/${devTokenAddress}`;

export const charmVerseBankAddress = '0x84a94307CD0eE34C8037DfeC056b53D7004f04a0';

export const subscriptionTierOrder: SpaceSubscriptionTier[] = [
  'readonly',
  'free',
  'bronze',
  'silver',
  'gold',
  'grant'
] as const;

export const upgradableTiers = ['bronze', 'silver', 'gold'] as const;
export type UpgradableTier = (typeof upgradableTiers)[number];

export const downgradeableTiers: SpaceSubscriptionTier[] = ['free', 'bronze', 'silver', 'gold'] as const;
export type DowngradeableTier = (typeof downgradeableTiers)[number];

export const tierConfig: Record<SpaceSubscriptionTier, { name: string; iconPath: string; tokenPrice: number }> = {
  readonly: {
    name: 'Expired',
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
    tokenPrice: 1_000,
    iconPath: '/images/subscriptions/bronze.svg'
  },
  silver: {
    name: 'Silver',
    tokenPrice: 2_500,
    iconPath: '/images/subscriptions/silver.svg'
  },
  gold: {
    name: 'Gold',
    tokenPrice: 10_000,
    iconPath: '/images/subscriptions/gold.svg'
  }
};

export function isDowngrade(oldTier: DowngradeableTier, newTier: DowngradeableTier) {
  return subscriptionTierOrder.indexOf(oldTier) > subscriptionTierOrder.indexOf(newTier);
}

export const decentApiKey = env('DECENT_API_KEY') || (process.env.REACT_APP_DECENT_API_KEY as string);
