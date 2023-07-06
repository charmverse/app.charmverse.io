import { getLoopProducts } from 'lib/loop/loop';
import { NotFoundError } from 'lib/middleware';

import { loopCheckoutUrl } from './constants';
import { getCouponDetails } from './getCouponDetails';
import type { CreateCryptoSubscriptionRequest, CreateCryptoSubscriptionResponse } from './interfaces';
import { stripeClient } from './stripe';

export async function createCryptoSubscription({
  subscriptionId,
  email,
  coupon
}: CreateCryptoSubscriptionRequest): Promise<CreateCryptoSubscriptionResponse> {
  const encodedEmail = encodeURIComponent(email);
  const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
  await stripeClient.subscriptions.del(subscriptionId);
  await stripeClient.customers.update(subscription.customer as string, {
    email
  });

  const priceId = subscription.items.data[0].price.id;
  const quantity = subscription.items.data[0].quantity;

  let promoCodeData;
  if (coupon) {
    promoCodeData = await getCouponDetails(coupon);
  }

  const newSubscription = await stripeClient.subscriptions.create({
    metadata: {
      ...(subscription.metadata || {})
    },
    customer: subscription.customer as string,
    items: [
      {
        price: priceId,
        quantity
      }
    ],
    ...(promoCodeData && {
      [promoCodeData.type]: promoCodeData.id
    }),
    payment_settings: {
      save_default_payment_method: 'on_subscription'
    },
    collection_method: 'send_invoice',
    days_until_due: 0,
    payment_behavior: 'default_incomplete'
  });

  const loopItems = await getLoopProducts();
  const loopItem = loopItems.find((product) => product.externalId === priceId);

  if (!loopItem) {
    throw new NotFoundError('Loop item not found');
  }

  return loopItem.url
    ? `${loopItem.url}?embed=true&cartEnabled=false&email=${encodedEmail}&sub=${newSubscription.id}`
    : `${loopCheckoutUrl}/${loopItem.entityId}/${loopItem.itemId}?embed=true&cartEnabled=false&email=${encodedEmail}&sub=${newSubscription.id}`;
}
