import { ExternalServiceError } from '@charmverse/core/errors';

import { getLoopProducts } from 'lib/loop/loop';
import { NotFoundError } from 'lib/middleware';

import { loopCheckoutUrl } from './constants';
import { createProSubscription } from './createProSubscription';
import type { CreateCryptoSubscriptionResponse, CreateSubscriptionRequest } from './interfaces';

export async function createCryptoSubscription({
  spaceId,
  period,
  productId,
  billingEmail,
  name,
  address,
  coupon = ''
}: {
  spaceId: string;
} & CreateSubscriptionRequest): Promise<CreateCryptoSubscriptionResponse> {
  const subscriptionData = await createProSubscription({
    spaceId,
    period,
    productId,
    billingEmail,
    name,
    address,
    coupon
  });

  const loopItems = await getLoopProducts();
  const loopItem = loopItems.find((product) => product.externalId === subscriptionData?.priceId);

  if (!loopItem) {
    throw new NotFoundError('Loop item not found');
  }

  return loopItem.url
    ? `${loopItem.url}?embed=true&cartEnabled=false&email=${billingEmail}&sub=${subscriptionData.subscriptionId}`
    : `${loopCheckoutUrl}/${loopItem.entityId}/${loopItem.itemId}?embed=true&cartEnabled=false&email=${billingEmail}&sub=${subscriptionData.subscriptionId}`;
}
