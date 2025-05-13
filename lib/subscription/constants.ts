import { isProdEnv } from '@root/config/constants';

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
  free: [
    'Community space with docs, databases, & forum',
    'Member Directory, Proposal Builder, & crypto payments',
    'Include 500,000 blocks',
    'Integrate with Discord, Snapshot, Safe, & NFTs/POAPs',
    'Compatible with most EVM chains',
    'Upload limit/video: 20MB'
  ],
  community: [
    'All Public Goods features, and',
    'Include 30,000 blocks',
    'Comprehensive access control. Unlimited roles',
    'Custom domain',
    'API access',
    'Invite 100 guests',
    'Up to 200 monthly active members',
    'Upload limit/video: 1GB'
  ],
  enterprise: [
    'Everything in Community, and',
    '200+ monthly active members',
    'Custom block limit',
    'Custom guest limit',
    'Custom video upload limit',
    'Usage & engagement analytics',
    'Dedicated success manager'
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
