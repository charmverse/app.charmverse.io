import type { SubscriptionPeriod, SubscriptionUsage } from 'lib/subscription/constants';

import type { BaseEvent } from './BaseEvent';

export type ViewSubscriptionEvent = BaseEvent;
export type InitiateSubscriptionEvent = BaseEvent;

export type CheckoutSubscriptionEvent = BaseEvent & {
  fullName: string;
  billingEmail: string;
  streetAddress: string;
  usage: SubscriptionUsage;
  period: SubscriptionPeriod;
  tier: 'pro';
  result: 'success' | 'failure';
};

export type SubscriptionEventMap = {
  view_subscription: ViewSubscriptionEvent;
  initiate_subscription: InitiateSubscriptionEvent;
  checkout_subscription: CheckoutSubscriptionEvent;
};
