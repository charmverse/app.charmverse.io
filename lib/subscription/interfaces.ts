import type { AddressParam } from '@stripe/stripe-js';
import type { Stripe } from 'stripe';

import type { SubscriptionPeriod } from './constants';

export type CreateProSubscriptionRequest = {
  blockQuota: number;
  period: SubscriptionPeriod;
  billingEmail?: string;
  name?: string;
  address?: AddressParam;
  coupon?: string;
  freeTrial?: boolean;
};

export type SubscriptionPaymentIntent = {
  subscriptionId: string;
  paymentIntentId: string;
  clientSecret: string;
  paymentIntentStatus: Stripe.PaymentIntent.Status;
  subTotalPrice: number;
  totalPrice: number;
};

export type ProSubscriptionResponse = {
  subscriptionId: string;
  priceId: string;
  invoiceId: string;
  blockQuota: number;
  productId: string;
  customerId: string;

  // These values are only sent back when creating a subscription with the user present
  paymentIntent?: SubscriptionPaymentIntent;
};
export type CreateCryptoSubscriptionResponse = string;

export type CreateCryptoSubscriptionRequest = {
  subscriptionId: string;
  email: string;
};

export type StripeMetadataKeys = {
  domain: string;
  spaceId: string;
};
