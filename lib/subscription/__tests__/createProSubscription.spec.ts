/* eslint-disable camelcase */

import { v4 } from 'uuid';

import { InvalidStateError, NotFoundError } from 'lib/middleware';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { addSpaceSubscription } from 'testing/utils/spaces';

import { communityProduct } from '../constants';
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
    prices: {
      list: jest.fn()
    },
    subscriptions: {
      create: jest.fn(),
      search: jest.fn()
    }
  }
}));

describe('createProSubscription', () => {
  it('should successfully create pro subscription in Stripe and return client secret and payment intent', async () => {
    const { space } = await generateUserAndSpaceWithApiToken();

    const subscriptionId = v4();
    const client_secret = v4();
    const customerId = v4();
    const paymentId = v4();
    const priceId = v4();

    const createCustomersMockFn = jest.fn().mockResolvedValue({
      id: customerId
    });

    const updateCustomersMockFn = jest.fn().mockResolvedValue({
      id: customerId
    });

    const listCustomersMockFn = jest.fn().mockResolvedValue({
      data: []
    });

    const listPricesMockFn = jest.fn().mockResolvedValue({
      data: [{ id: priceId, recurring: { interval: 'month' }, unit_amount: 120 }]
    });

    const createSubscriptionsMockFn = jest.fn().mockResolvedValue({
      id: subscriptionId,
      latest_invoice: {
        payment_intent: {
          client_secret,
          status: 'incomplete',
          id: paymentId
        }
      },
      metadata: {
        spaceId: space.id,
        tier: 'pro',
        period: 'monthly',
        productId: communityProduct.id
      },
      customer: {
        id: customerId,
        metadata: {
          spaceId: space.id,
          domain: space.domain
        }
      }
    });

    const searchSubscriptionsMockFn = jest.fn().mockResolvedValue({
      id: subscriptionId,
      data: [],
      latest_invoice: {
        payment_intent: {
          client_secret,
          status: 'pending',
          id: paymentId
        }
      }
    });

    (stripeClient.customers.create as jest.Mock<any, any>) = createCustomersMockFn;
    (stripeClient.customers.update as jest.Mock<any, any>) = updateCustomersMockFn;
    (stripeClient.subscriptions.create as jest.Mock<any, any>) = createSubscriptionsMockFn;
    (stripeClient.subscriptions.search as jest.Mock<any, any>) = searchSubscriptionsMockFn;
    (stripeClient.customers.list as jest.Mock<any, any>) = listCustomersMockFn;
    (stripeClient.prices.list as jest.Mock<any, any>) = listPricesMockFn;

    const { paymentIntent } = await createProSubscription({
      period: 'monthly',
      spaceId: space.id,
      blockQuota: 10,
      billingEmail: 'test@gmail.com',
      coupon: ''
    });

    expect(createCustomersMockFn).toHaveBeenCalledWith({
      name: space.name,
      email: 'test@gmail.com',
      metadata: {
        spaceId: space.id,
        domain: space.domain
      }
    });

    expect(listPricesMockFn).toHaveBeenCalledWith({
      product: 'community',
      type: 'recurring',
      active: true
    });

    expect(createSubscriptionsMockFn).toHaveBeenCalledWith({
      coupon: '',
      metadata: {
        tier: 'pro',
        period: 'monthly',
        spaceId: space.id,
        productId: communityProduct.id
      },
      customer: customerId,
      items: [
        {
          price: priceId,
          quantity: 10
        }
      ],
      payment_settings: {
        save_default_payment_method: 'on_subscription'
      },
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });

    expect(paymentIntent?.paymentIntentStatus).toStrictEqual('incomplete');
    expect(paymentIntent?.clientSecret).toStrictEqual(client_secret);
  });

  it("should throw error if space doesn't exist", async () => {
    await expect(
      createProSubscription({
        period: 'monthly',
        spaceId: v4(),
        blockQuota: 10,
        billingEmail: 'test@gmail.com'
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  // it('should throw error if space already has an active subscription', async () => {
  //   const { space } = await generateUserAndSpaceWithApiToken();

  //   await addSpaceSubscription({
  //     spaceId: space.id
  //   });

  //   await expect(
  //     createProSubscription({
  //       period: 'monthly',
  //       spaceId: space.id,
  //       blockQuota: 10,
  //       billingEmail: 'test@gmail.com'
  //     })
  //   ).rejects.toBeInstanceOf(InvalidStateError);
  // });
});
