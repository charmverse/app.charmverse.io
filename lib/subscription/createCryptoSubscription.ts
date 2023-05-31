import { DataNotFoundError, ExternalServiceError } from '@charmverse/core';
import { prisma } from '@charmverse/core/prisma-client';
import type { AddressParam } from '@stripe/stripe-js';

import { getLoopProducts } from 'lib/loop/loop';
import { InvalidStateError, NotFoundError } from 'lib/middleware';

import type { SubscriptionPeriod, SubscriptionProductId } from './constants';
import { loopCheckoutUrl } from './constants';
import { createStripeSubscription } from './createStripeSubscription';

export type CreateCryptoSubscriptionRequest = {
  productId: SubscriptionProductId;
  paymentMethodId?: string;
  period: SubscriptionPeriod;
  billingEmail: string;
  name?: string;
  address?: AddressParam;
  coupon?: string;
};

export type CreateCryptoSubscriptionResponse = string;

export async function createCryptoSubscription({
  spaceId,
  paymentMethodId,
  period,
  productId,
  billingEmail,
  name,
  address,
  coupon = ''
}: {
  spaceId: string;
} & CreateCryptoSubscriptionRequest): Promise<CreateCryptoSubscriptionResponse> {
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: {
      domain: true,
      id: true,
      name: true,
      stripeSubscription: {
        where: {
          deletedAt: null
        },
        take: 1,
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (!space) {
    throw new NotFoundError('Space not found');
  }

  const activeSpaceSubscription = space.stripeSubscription?.find(
    (sub) => sub.productId === productId && sub.period === period
  );

  if (activeSpaceSubscription) {
    throw new InvalidStateError('Space already has a subscription');
  }

  const subscriptionData = await createStripeSubscription({
    paymentMethodId,
    spaceId,
    period,
    productId,
    billingEmail,
    name,
    address,
    coupon
  });

  if (!subscriptionData) {
    throw new DataNotFoundError('Insufficient data to create subscription');
  }

  let loopItem;
  try {
    const loopItems = await getLoopProducts();
    loopItem = loopItems.find((product) => product.externalId === subscriptionData?.priceId);
  } catch (error: any) {
    throw new ExternalServiceError('Loop failed to retrieve the requested items');
  }

  if (!loopItem) {
    throw new NotFoundError('Loop item not found');
  }

  return loopItem.url
    ? `${loopItem.url}?embed=true&cartEnabled=false&sub=${subscriptionData.subscriptionId}`
    : `${loopCheckoutUrl}/${loopItem.entityId}/${loopItem.itemId}?embed=true&cartEnabled=false&sub=${subscriptionData.subscriptionId}`;
}
