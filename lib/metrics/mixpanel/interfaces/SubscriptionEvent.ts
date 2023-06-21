import type { SubscriptionTier } from '@charmverse/core/prisma-client';

import type { SubscriptionPeriod } from 'lib/subscription/constants';

import type { BaseEvent } from './BaseEvent';

export type ViewSubscriptionEvent = BaseEvent;
export type InitiateSubscriptionEvent = BaseEvent;

export type CheckoutSubscriptionEvent = BaseEvent & {
  productId: string;
  period: SubscriptionPeriod;
  tier: SubscriptionTier;
  result: 'success' | 'failure' | 'pending';
};

export type SubscriptionEventMap = {
  view_subscription: ViewSubscriptionEvent;
  initiate_subscription: InitiateSubscriptionEvent;
  checkout_subscription: CheckoutSubscriptionEvent;
};
