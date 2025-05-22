import { isProdEnv } from '@packages/config/constants';

// Stripe Constants

export type SubscriptionPeriod = 'monthly' | 'annual';

// Equivalent to 30k
export const defaultFreeBlockQuota = 30;
export const blocksPerCharm = 1000;

export const communityProduct = {
  id: 'community',
  tier: 'community',
  name: 'CharmVerse Community',
  guestLimit: 100,
  // This is base number we use to calculate block limits. We multiply this by the quantity in Stripe.
  // For example, 30k blocks = 30 quantity * 1000 blockQuotaIncrement
  blockQuotaIncrement: 1000,
  monthlyActiveUserLimit: 25,
  trial: 30,
  pricing: {
    annual: 12,
    monthly: 1.2
  }
} as const;

export type SubscriptionProductId = typeof communityProduct.id;

// Loop constants

export const loopCheckoutUrl = isProdEnv ? 'https://checkout.loopcrypto.xyz' : 'https://demo.checkout.loopcrypto.xyz';
export const loopApiUrl = isProdEnv ? 'https://api.loopcrypto.xyz' : 'https://demo.api.loopcrypto.xyz';

// General subscription info

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

export const SubscriptionStatus = {
  active: 'active',
  past_due: 'past_due',
  pending: 'pending',
  cancelled: 'cancelled',
  cancel_at_end: 'cancel_at_end',
  unpaid: 'unpaid'
};

export type SubscriptionStatusType = keyof typeof SubscriptionStatus;

export const DeprecatedFreeTrial = 'deprecated_free_trial';

// Custom domain access tiers
export const CUSTOM_DOMAIN_TIERS = ['silver', 'gold', 'grant'] as const;

export function hasCustomDomainAccess(subscriptionTier: string | null | undefined): boolean {
  return CUSTOM_DOMAIN_TIERS.includes(subscriptionTier as any);
}
