import { getLoopProducts } from 'lib/loop/loop';
import { NotFoundError } from 'lib/middleware';

import { loopCheckoutUrl } from './constants';
import type { CreateCryptoSubscriptionRequest, CreateCryptoSubscriptionResponse } from './interfaces';
import { stripeClient } from './stripe';

export async function createCryptoSubscription({
  subscriptionId,
  email
}: CreateCryptoSubscriptionRequest): Promise<CreateCryptoSubscriptionResponse> {
  const encodedEmail = encodeURIComponent(email);
  const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);

  const priceId = subscription.items.data[0].price.id;

  await stripeClient.customers.update(subscription.customer as string, {
    email
  });

  const loopItems = await getLoopProducts();
  const loopItem = loopItems.find((product) => product.externalId === priceId);

  if (!loopItem) {
    throw new NotFoundError('Loop item not found');
  }

  return loopItem.url
    ? `${loopItem.url}?embed=true&cartEnabled=false&email=${encodedEmail}&sub=${subscriptionId}`
    : `${loopCheckoutUrl}/${loopItem.entityId}/${loopItem.itemId}?embed=true&cartEnabled=false&email=${encodedEmail}&sub=${subscriptionId}`;
}
