import { isProdEnv } from 'config/constants';

// Stripe Constants

export type SubscriptionPeriod = 'monthly' | 'annual';

export const communityProduct = {
  id: 'community',
  tier: 'pro',
  name: 'CharmVerse Community',
  guestLimit: 100,
  blockLimit: 10000,
  trial: 90,
  monthlyActiveUserLimit: 25,
  pricing: {
    annual: 10,
    monthly: 12
  }
} as const;

export type SubscriptionProductId = typeof communityProduct.id;

// Loop constants

export const loopCheckoutUrl = isProdEnv ? 'https://checkout.loopcrypto.xyz' : 'https://demo.checkout.loopcrypto.xyz';
export const loopApiUrl = isProdEnv ? 'https://api.loopcrypto.xyz' : 'https://demo.api.loopcrypto.xyz';

// General subscription info

export const subscriptionDetails = {
  free: [
    '100% space viewable by anyone on the Internet',
    'Docs, Database, Forums. Member Directory, Proposal Builder',
    'Up to 200 monhthly active members',
    'Integrate with Discord, Snapshot, SAFE , NFTs & POAPS'
  ],
  community: [
    'Everything in Free and',
    'Comprehensive access control & unlimited roles',
    'Invite 100 guetss',
    'Custom domain',
    'API  access'
  ],
  enterprise: [
    'Everything in Community and',
    '200+ monthly active members',
    'Custom guest limit',
    'Dedicated success manager'
  ]
};

export const subscriptionCancellationDetails = {
  first:
    'Cancelling CharmVerse Community Edition will revert this space to the Free Plan at the end of the current billing period. The following changes will be made: ',
  list: [
    'All content will be made public and shared on the web',
    'All custom roles will be removed',
    'All users will have the default member role',
    'Custom domains will be removed',
    'API access will be removed'
  ],
  last: 'You will still be able to use CharmVerse for your community but you will be working in public.'
};
