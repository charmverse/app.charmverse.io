import { ExternalServiceError } from '@charmverse/core';
import { prisma } from '@charmverse/core/prisma-client';

import { NotFoundError } from 'lib/middleware';

import { Charge } from './coinbase';
import type { SubscriptionPeriod, SubscriptionUsage } from './constants';
import { SUBSCRIPTION_USAGE_RECORD } from './constants';
import { stripeClient } from './stripe';

export type PaymentDetails = {
  fullName: string;
  billingEmail: string;
  streetAddress: string;
};

export type CreateCoinbasePaymentRequest = PaymentDetails & {
  spaceId: string;
  usage: SubscriptionUsage;
  period: SubscriptionPeriod;
};

export async function createCoinbasePayment({
  spaceId,
  userId,
  period,
  usage,
  // Try to send this as meta data
  billingEmail,
  fullName,
  streetAddress
}: CreateCoinbasePaymentRequest & { userId: string }) {
  const space = await prisma.space.findUnique({
    where: { id: spaceId }
  });

  if (!space) {
    throw new NotFoundError('Space not found');
  }

  const product = await stripeClient.products.retrieve(`pro-${usage}-${period}`);

  // In cent so multiplying by 100
  const amount = SUBSCRIPTION_USAGE_RECORD[usage].pricing[period] * (period === 'monthly' ? 1 : 12);

  const chargeData = {
    name: product.name,
    description: product.description || `Pro subscription package pro-${usage}-${period}`,
    pricing_type: 'fixed_price' as const,
    local_price: {
      amount: String(amount),
      currency: 'USD'
    },
    metadata: {
      id: product.id,
      userID: userId
    }
  };

  try {
    const charge = await Charge.create(chargeData);

    // @TODO Create a payment record with pending status, spaceId and billing if necessary

    return charge;
  } catch (error) {
    throw new ExternalServiceError('Failed to create subscription');
  }
}
