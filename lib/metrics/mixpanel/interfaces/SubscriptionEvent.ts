import type { SubscriptionPeriod } from 'lib/subscription/constants';
import type { PaymentMethodType } from 'lib/subscription/mapStripeFields';

import type { BaseEvent } from './BaseEvent';

export type CreateSubscriptionEvent = BaseEvent & {
  paymentMethod: PaymentMethodType;
  blockQuota: number;
  period: SubscriptionPeriod;
};

export type CancelSubscriptionEvent = BaseEvent & {
  subscriptionId: string;
  blockQuota: number;
};

export type UpdateSubscriptionEvent = BaseEvent & {
  subscriptionId: string;
  blockQuota: number;
  period: SubscriptionPeriod;
  previousBlockQuota: number;
  previousPeriod: SubscriptionPeriod;
};

export type SubscriptionPaymentEvent = BaseEvent & {
  subscriptionId: string;
  paymentMethod: PaymentMethodType;
  blockQuota: number;
  period: SubscriptionPeriod;
  status: 'success' | 'failure';
};

export type ClickBillingSettingsEvent = BaseEvent;

export type ViewSubscriptionMarketingScreen = BaseEvent;

export type ViewCheckoutScreen = BaseEvent;

export type SubscriptionEventMap = {
  create_subscription: CreateSubscriptionEvent;
  cancel_subscription: CancelSubscriptionEvent;
  update_subscription: UpdateSubscriptionEvent;
  subscription_payment: SubscriptionPaymentEvent;
  click_billing_settings: ClickBillingSettingsEvent;
  view_subscription_marketing_screen: ViewSubscriptionMarketingScreen;
  view_checkout_screen: ViewCheckoutScreen;
};
