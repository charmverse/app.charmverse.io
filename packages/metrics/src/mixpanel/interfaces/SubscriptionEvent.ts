import type { SubscriptionPeriod } from '@packages/lib/subscription/constants';

import type { BaseEvent } from './BaseEvent';

type StripeBaseEvent = BaseEvent & {
  subscriptionId: string;
};

export type CreateSubscriptionEvent = StripeBaseEvent & {
  blockQuota?: number;
  period: SubscriptionPeriod;
};

export type CancelSubscriptionEvent = StripeBaseEvent & {
  blockQuota: number;
};

export type UpdateSubscriptionEvent = StripeBaseEvent & {
  blockQuota: number;
  period: SubscriptionPeriod;
  previousBlockQuota: number;
  previousPeriod: SubscriptionPeriod;
};

export type SubscriptionPaymentEvent = StripeBaseEvent & {
  paymentMethod: 'card' | 'ach' | 'crypto';
  blockQuota?: number;
  period: SubscriptionPeriod;
  status: 'success' | 'failure';
};

export type SubscriptionEventMap = {
  create_subscription: CreateSubscriptionEvent;
  cancel_subscription: CancelSubscriptionEvent;
  update_subscription: UpdateSubscriptionEvent;
  subscription_payment: SubscriptionPaymentEvent;
};
