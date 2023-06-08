import { ExternalServiceError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import { getLoopProducts } from 'lib/loop/loop';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { InvalidStateError, NotFoundError } from 'lib/middleware';

import { loopCheckoutUrl } from './constants';
import { createProSubscription } from './createProSubscription';
import type { CreateCryptoSubscriptionResponse, CreateSubscriptionRequest } from './interfaces';

export async function createCryptoSubscription({
  userId,
  spaceId,
  period,
  productId,
  billingEmail,
  name,
  address,
  coupon = ''
}: {
  userId: string;
  spaceId: string;
} & CreateSubscriptionRequest): Promise<CreateCryptoSubscriptionResponse> {
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

  const subscriptionData = await createProSubscription({
    spaceId,
    period,
    productId,
    billingEmail,
    name: name || space.name,
    address,
    coupon
  });

  trackUserAction('checkout_subscription', {
    userId,
    spaceId,
    billingEmail,
    productId,
    period,
    tier: 'pro',
    result: 'pending'
  });

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
    ? `${loopItem.url}?embed=true&cartEnabled=false&email=${billingEmail}&sub=${subscriptionData.subscriptionId}`
    : `${loopCheckoutUrl}/${loopItem.entityId}/${loopItem.itemId}?embed=true&cartEnabled=false&email=${billingEmail}&sub=${subscriptionData.subscriptionId}`;
}
