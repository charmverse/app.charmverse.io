import type { SubscriptionTier } from '@charmverse/core/dist/cjs/prisma';

import type { SubscriptionUsage, SubscriptionPeriod } from './utils';

export type SpaceSubscription = {
  usage: SubscriptionUsage;
  tier: SubscriptionTier;
  period: SubscriptionPeriod;
};
