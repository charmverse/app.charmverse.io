import type { AddressParam } from '@stripe/stripe-js';
import type { Stripe } from 'stripe';

import type { SubscriptionPeriod } from './constants';
import type { SpaceSubscriptionWithStripeData } from './getActiveSpaceSubscription';

export type CreateProSubscriptionRequest = {
  blockQuota: number;
  period: SubscriptionPeriod;
  billingEmail?: string;
  name?: string;
  address?: AddressParam;
  coupon?: string;
  freeTrial?: boolean;
};

export type ProSubscriptionResponse = {
  subscriptionId: string;
  priceId: string;
  invoiceId: string;
  blockQuota: number;
  productId: string;
  customerId: string;
  paymentIntentId: string;
  clientSecret: string;
  paymentIntentStatus: Stripe.PaymentIntent.Status;
  subTotalPrice: number;
  totalPrice: number;
};

export type CreateProSubscriptionResponse = Pick<
  ProSubscriptionResponse,
  'clientSecret' | 'subscriptionId' | 'paymentIntentStatus' | 'totalPrice' | 'subTotalPrice'
>;

export type CreateCryptoSubscriptionResponse = string;

export type CreateCryptoSubscriptionRequest = {
  subscriptionId: string;
  email: string;
};
