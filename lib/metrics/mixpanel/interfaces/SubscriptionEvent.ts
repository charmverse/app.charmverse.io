import type { SubscriptionPeriod, SubscriptionProductId } from 'lib/subscription/constants';

import type { BaseEvent } from './BaseEvent';

export type ViewSubscriptionEvent = BaseEvent;
export type InitiateSubscriptionEvent = BaseEvent;

export type CheckoutSubscriptionEvent = BaseEvent & {
  billingEmail: string;
  productId: SubscriptionProductId;
  period: SubscriptionPeriod;
  tier: 'pro';
  result: 'success' | 'failure' | 'pending';
};

export type SubscriptionEventMap = {
  view_subscription: ViewSubscriptionEvent;
  initiate_subscription: InitiateSubscriptionEvent;
  checkout_subscription: CheckoutSubscriptionEvent;
};
