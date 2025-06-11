import env from '@beam-australia/react-env';
import type { SpaceSubscriptionTier } from '@charmverse/core/prisma';

export const devTokenAddress = '0x047157cffb8841a64db93fd4e29fa3796b78466c';
export const uniswapSwapUrl = `https://app.uniswap.org/explore/tokens/base/${devTokenAddress}`;

export const charmVerseBankAddress = '0x1cD919942a8EF3e867Fe9C0813BC4851090cF037';

export const subscriptionTierOrder: SpaceSubscriptionTier[] = [
  'readonly',
  'free',
  'bronze',
  'silver',
  'gold',
  'grant'
] as const;

export const subscriptionDetails = {
  public: [
    'Community space with docs, databases, & forum',
    'Unlimited blocks (100% public content)',
    'Integrate with Discord, Snapshot, Safe, & NFTs/POAPs',
    '1 token gate on Ethereum & 1 decision workflow',
    'Upload limit/video: 20MB',
    'No guest access'
  ],
  bronze: [
    'All Public tier features with 5K blocks',
    '1 custom role and 1 token gate (Ethereum blockchain only)',
    '2 decision workflows',
    'Guest access',
    'Upload limit/video: 1GB'
  ],
  silver: [
    'All Bronze tier features with 10K blocks',
    '3 custom roles and 3 token gates (all supported chains)',
    '3 decision workflows',
    'Custom domain'
  ],
  gold: [
    'All Silver tier features with 100K blocks',
    'Unlimited custom roles and token gates (all supported chains)',
    '5 decision workflows',
    'Standardize user identity (require an identity to be part of the space)',
    'API access'
  ],
  grant: [
    'All Gold tier features with unlimited blocks',
    'Unlimited decision workflows',
    'White glove onboarding and setup audits'
  ]
};

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
export const devTokenDecimals = 18;

export const NULL_EVM_ADDRESS = '0x0000000000000000000000000000000000000000';
