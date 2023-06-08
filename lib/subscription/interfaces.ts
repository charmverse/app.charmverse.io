import type { AddressParam } from '@stripe/stripe-js';
import type { Stripe } from 'stripe';

import type { SubscriptionPeriod, SubscriptionProductId } from './constants';

export type CreateSubscriptionRequest = {
  productId: SubscriptionProductId;
  period: SubscriptionPeriod;
  billingEmail: string;
  name?: string;
  address?: AddressParam;
  coupon?: string;
};

export type ProSubscriptionResponse = {
  subscriptionId: string;
  priceId?: string;
  invoiceId: string;
  productId: string;
  customerId: string;
  paymentIntentId?: string;
  clientSecret?: string;
  paymentIntentStatus?: Stripe.PaymentIntent.Status;
};

export type CreateCryptoSubscriptionResponse = string;
export type CreatePaymentSubscriptionResponse = Pick<ProSubscriptionResponse, 'paymentIntentStatus' | 'clientSecret'>;
