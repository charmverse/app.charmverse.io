/* eslint-disable camelcase */

import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { InvalidStateError, NotFoundError } from 'lib/middleware';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { addSpaceSubscription } from 'testing/utils/spaces';

import { SUBSCRIPTION_PRODUCTS_RECORD } from '../constants';
import { createProSubscription } from '../createProSubscription';
import { stripeClient } from '../stripe';

jest.mock('../stripe', () => ({
  stripeClient: {
    customers: {
      create: jest.fn(),
      list: jest.fn()
    },
    products: {
      retrieve: jest.fn()
    },
    subscriptions: {
      create: jest.fn()
    }
  }
}));

describe('createProSubscription', () => {
  it('should successfully create pro subscription for space and return client secret along with subscriptionId', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();

    const paymentMethodId = v4();
    const subscriptionId = v4();
    const client_secret = v4();
    const customerId = v4();
    const productId = v4();

    const createCustomersMockFn = jest.fn().mockResolvedValue({
      id: customerId
    });

    const retrieveProductsMockFn = jest.fn().mockResolvedValue({
      id: productId
    });

    const listCustomersMockFn = jest.fn().mockResolvedValue({
      data: []
    });

    const createSubscriptionsMockFn = jest.fn().mockResolvedValue({
      id: subscriptionId,
      latest_invoice: {
        payment_intent: {
          client_secret,
          status: 'succeeded'
        }
      }
    });

    (stripeClient.customers.create as jest.Mock<any, any>) = createCustomersMockFn;
    (stripeClient.products.retrieve as jest.Mock<any, any>) = retrieveProductsMockFn;
    (stripeClient.subscriptions.create as jest.Mock<any, any>) = createSubscriptionsMockFn;
    (stripeClient.customers.list as jest.Mock<any, any>) = listCustomersMockFn;

    const { clientSecret, paymentIntentStatus } = await createProSubscription({
      paymentMethodId,
      period: 'monthly',
      spaceId: space.id,
      productId: 'community_5k',
      userId: user.id,
      billingEmail: 'test@gmail.com'
    });

    expect(createCustomersMockFn).toHaveBeenCalledWith({
      name: `John Doe`,
      payment_method: paymentMethodId,
      invoice_settings: { default_payment_method: paymentMethodId },
      email: 'test@gmail.com'
    });

    expect(retrieveProductsMockFn).toHaveBeenCalledWith(`community_5k`);

    expect(createSubscriptionsMockFn).toHaveBeenCalledWith({
      metadata: {
        tier: 'pro',
        period: 'monthly',
        usage: 1,
        spaceId: space.id
      },
      customer: customerId,
      items: [
        {
          price_data: {
            currency: 'USD',
            product: productId,
            unit_amount: SUBSCRIPTION_PRODUCTS_RECORD.community_5k.pricing.monthly * 100,
            recurring: {
              interval: 'month'
            }
          }
        }
      ],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent']
    });

    expect(
      await prisma.stripeSubscription.findFirstOrThrow({
        where: {
          spaceId: space.id,
          customerId,
          subscriptionId,
          productId,
          period: 'monthly'
        }
      })
    ).not.toBeFalsy();

    expect(paymentIntentStatus).toStrictEqual('succeeded');
    expect(clientSecret).toStrictEqual(client_secret);
  });

  it("should throw error if space doesn't exist", async () => {
    const paymentMethodId = v4();

    await expect(
      createProSubscription({
        paymentMethodId,
        period: 'monthly',
        spaceId: v4(),
        productId: 'community_5k',
        billingEmail: 'test@gmail.com',
        userId: v4()
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw error if space already has an active subscription', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();

    await addSpaceSubscription({
      spaceId: space.id,
      createdBy: user.id
    });

    const paymentMethodId = v4();

    await expect(
      createProSubscription({
        paymentMethodId,
        period: 'monthly',
        spaceId: space.id,
        productId: 'community_5k',
        billingEmail: 'test@gmail.com',
        userId: v4()
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });
});
