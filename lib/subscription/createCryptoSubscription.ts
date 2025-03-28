import { prisma } from '@charmverse/core/prisma-client';
import { NotFoundError } from '@packages/nextjs/errors';
import { getLoopProducts } from '@root/lib/loop/loop';

import { communityProduct, loopCheckoutUrl } from './constants';
import { getCouponDetails } from './getCouponDetails';
import { getCommunityPrice } from './getProductPrice';
import type {
  CreateCryptoSubscriptionRequest,
  CreateCryptoSubscriptionResponse,
  StripeMetadataKeys
} from './interfaces';
import { stripeClient } from './stripe';

export async function createCryptoSubscription({
  billingEmail,
  period,
  blockQuota,
  coupon,
  name,
  address,
  spaceId
}: CreateCryptoSubscriptionRequest & { spaceId: string }): Promise<CreateCryptoSubscriptionResponse> {
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: {
      domain: true,
      id: true,
      name: true
    }
  });

  if (!space) {
    throw new NotFoundError('Space not found');
  }

  const productId = communityProduct.id;
  const encodedEmail = encodeURIComponent(billingEmail || '');
  const customerSearchResults = await stripeClient.customers.search({
    query: `metadata['spaceId']:'${spaceId}'`
  });

  const existingStripeCustomer = customerSearchResults.data.find((_customer) => !_customer.deleted);
  const customer =
    existingStripeCustomer ||
    (await stripeClient.customers.create({
      metadata: {
        spaceId,
        domain: space.domain
      } as StripeMetadataKeys,
      address,
      name: name || space.name,
      email: billingEmail
    }));

  const oldSubscriptions = await stripeClient.subscriptions.search({
    query: `metadata['spaceId']:'${spaceId}' AND status:'past_due'`
  });

  // This is only for new customers to be sure that we delete all payment methods. This is how Loop works right now.
  const customerId = customer.id;
  const paymentMethods = await stripeClient.paymentMethods.list({
    customer: customerId
  });

  for (const paymentMethod of paymentMethods.data) {
    await stripeClient.paymentMethods.detach(paymentMethod.id);
  }

  for (const oldSubscription of oldSubscriptions.data) {
    await stripeClient.subscriptions.del(oldSubscription.id);
  }

  if (existingStripeCustomer && existingStripeCustomer?.email !== billingEmail) {
    await stripeClient.customers.update(existingStripeCustomer.id as string, {
      email: billingEmail
    });
  }

  let promoCodeData;
  if (coupon) {
    promoCodeData = await getCouponDetails(coupon);
  }
  // Get all prices for the given product. Usually there will be two prices, one for monthly and one for yearly
  const productPrice = await getCommunityPrice(productId, period);

  const newSubscription = await stripeClient.subscriptions.create({
    metadata: {
      productId,
      period,
      tier: 'community',
      spaceId
    },
    customer: customer.id,
    items: [
      {
        price: productPrice.id,
        quantity: blockQuota
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
  const loopItem = loopItems.find((product) => product.externalId === productPrice.id);

  if (!loopItem) {
    throw new NotFoundError('Loop item not found');
  }

  // Minimum amount for the user to have in his wallet to be able to pay for the subscription
  const loopMinimumBalanceRequired = (productPrice.unit_amount || 120) * blockQuota;

  return loopItem.url
    ? `${loopItem.url}?embed=true&cartEnabled=false&email=${encodedEmail}&sub=${newSubscription.id}&minimumBalanceRequired=${loopMinimumBalanceRequired}`
    : `${loopCheckoutUrl}/${loopItem.entityId}/${loopItem.itemId}?embed=true&cartEnabled=false&email=${encodedEmail}&sub=${newSubscription.id}&minimumBalanceRequired=${loopMinimumBalanceRequired}`;
}
