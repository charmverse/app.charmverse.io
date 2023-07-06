import { testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { NotFoundError } from 'lib/middleware';
import { getSpaceAndSubscription } from 'testing/getSpaceSubscription';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { stripeMock, stripeMockIds } from 'testing/stripeMock';
import { addSpaceSubscription } from 'testing/utils/spaces';

import { communityProduct } from '../constants';
import { deleteProSubscription } from '../deleteProSubscription';
import { stripeClient } from '../stripe';

jest.doMock('../stripe', () => ({ ...stripeMock }));

describe('updateProSubscription', () => {
  it(`Should update pro subscription from our database`, async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();
    const customerId = `cus_${v4()}`;
    const subscriptionId = `sub_${v4()}`;

    await addSpaceSubscription({
      spaceId: space.id,
      customerId,
      subscriptionId
    });

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
        tier: 'pro',
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
    const spaceSubscription = await getSpaceAndSubscription(space.id);
    const subscription = spaceSubscription?.stripeSubscription?.[0];

    expect(spaceSubscription?.paidTier).toBe('cancelled');
    expect(!!subscription?.deletedAt).toBeTruthy();
  });
  it(`Should fail if the subscription is cancelled`, async () => {
    const userId = v4();

    await expect(
      deleteProSubscription({
        spaceId: v4(),
        userId
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
