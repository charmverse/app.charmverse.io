import { InvalidStateError, NotFoundError } from '@packages/nextjs/errors';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { stripeMock, stripeMockIds } from '@packages/testing/stripeMock';
import { addSpaceSubscription } from '@packages/testing/utils/spaces';
import { v4 } from 'uuid';

import { communityProduct } from '../constants';
import { createProSubscription } from '../createProSubscription';
import { stripeClient } from '../stripe';

jest.doMock('../stripe', () => ({ ...stripeMock }));

describe('createProSubscription', () => {
  it('should successfully create pro subscription in Stripe and return client secret and payment intent', async () => {
    const { space } = await generateUserAndSpaceWithApiToken();

    const createSubscriptionsMockFn = jest.fn().mockResolvedValue({
      id: stripeMockIds.subscriptionId,
      latest_invoice: {
        id: stripeMockIds.invoiceId,
        payment_intent: {
          client_secret: stripeMockIds.clientSecret,
          status: 'incomplete',
          id: stripeMockIds.paymentId
        }
      },
      metadata: {
        spaceId: space.id,
        tier: 'community',
        period: 'monthly',
        productId: communityProduct.id
      },
      customer: {
        id: stripeMockIds.customerId,
        metadata: {
          spaceId: space.id,
          domain: space.domain
        },
        email: 'test@gmail.com'
      },
      coupon: stripeMockIds.couponId
    });

    (stripeClient.subscriptions.create as jest.Mock<any, any>) = createSubscriptionsMockFn;
    (stripeClient.subscriptions.list as jest.Mock<any, any>) = stripeMock.stripeClient.subscriptions.list;
    (stripeClient.subscriptions.retrieve as jest.Mock<any, any>) = stripeMock.stripeClient.subscriptions.retrieve;
    (stripeClient.subscriptions.del as jest.Mock<any, any>) = stripeMock.stripeClient.subscriptions.del;
    (stripeClient.customers.create as jest.Mock<any, any>) = stripeMock.stripeClient.customers.create;
    (stripeClient.customers.update as jest.Mock<any, any>) = stripeMock.stripeClient.customers.update;
    (stripeClient.customers.search as jest.Mock<any, any>) = stripeMock.stripeClient.customers.search;
    (stripeClient.prices.list as jest.Mock<any, any>) = stripeMock.stripeClient.prices.list;
    (stripeClient.coupons.retrieve as jest.Mock<any, any>) = stripeMock.stripeClient.coupons.retrieve;
    (stripeClient.promotionCodes.list as jest.Mock<any, any>) = stripeMock.stripeClient.promotionCodes.list;

    const { paymentIntent, blockQuota, email, customerId, invoiceId, priceId, productId, subscriptionId } =
      await createProSubscription({
        period: 'monthly',
        spaceId: space.id,
        blockQuota: 10,
        billingEmail: 'test@gmail.com',
        coupon: stripeMockIds.couponId
      });

    expect(stripeMock.stripeClient.customers.create).toHaveBeenCalledWith({
      name: space.name,
      email: 'test@gmail.com',
      metadata: {
        spaceId: space.id,
        domain: space.domain
      }
    });

    expect(stripeMock.stripeClient.prices.list).toHaveBeenCalledWith({
      product: 'community',
      type: 'recurring',
      active: true
    });

    expect(createSubscriptionsMockFn).toHaveBeenCalledWith({
      coupon: undefined,
      promotion_code: undefined,
      metadata: {
        tier: 'community',
        period: 'monthly',
        spaceId: space.id,
        productId: communityProduct.id
      },
      customer: stripeMockIds.customerId,
      items: [
        {
          price: stripeMockIds.priceId,
          quantity: 10
        }
      ],
      payment_settings: {
        save_default_payment_method: 'on_subscription'
      },
      trial_period_days: undefined,
      trial_settings: undefined,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });

    expect(paymentIntent?.paymentIntentStatus).toStrictEqual('incomplete');
    expect(paymentIntent?.clientSecret).toStrictEqual(stripeMockIds.clientSecret);
    expect(blockQuota).toStrictEqual(10);
    expect(email).toStrictEqual('test@gmail.com');
    expect(customerId).toStrictEqual(stripeMockIds.customerId);
    expect(invoiceId).toStrictEqual(stripeMockIds.invoiceId);
    expect(priceId).toStrictEqual(stripeMockIds.priceId);
    expect(productId).toStrictEqual(communityProduct.id);
    expect(subscriptionId).toStrictEqual(stripeMockIds.subscriptionId);
    expect(paymentIntent?.coupon).toStrictEqual(stripeMockIds.couponId);
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

  it('should throw error if space already has an active subscription', async () => {
    const { space } = await generateUserAndSpaceWithApiToken();
    const subscriptionId = v4();

    await addSpaceSubscription({
      spaceId: space.id,
      subscriptionId,
      customerId: stripeMockIds.customerId
    });

    const retrieveSubscriptionsMockFn = jest.fn().mockResolvedValue({
      id: subscriptionId,
      latest_invoice: {
        payment_intent: {
          client_secret: stripeMockIds.clientSecret,
          status: 'incomplete',
          id: stripeMockIds.paymentId
        }
      },
      metadata: {
        spaceId: space.id,
        tier: 'pro',
        period: 'monthly',
        productId: communityProduct.id
      },
      customer: {
        id: stripeMockIds.customerId,
        metadata: {
          spaceId: space.id,
          domain: space.domain
        }
      },
      items: {
        data: [
          {
            quantity: 10,
            price: {
              id: stripeMockIds.priceId,
              recurring: {
                interval: 'month'
              },
              unit_amount: 10000
            }
          }
        ]
      },
      default_payment_method: {
        type: 'card',
        card: {
          last4: '4242',
          brand: 'visa'
        }
      },
      status: 'active'
    });

    (stripeClient.subscriptions.retrieve as jest.Mock<any, any>) = retrieveSubscriptionsMockFn;

    await expect(
      createProSubscription({
        period: 'monthly',
        spaceId: space.id,
        blockQuota: 10,
        billingEmail: 'test@gmail.com'
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });
});
