import type { Space } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { NotFoundError } from '@packages/nextjs/errors';
import { loopItemMock, stripeMock } from '@packages/testing/stripeMock';
import { addSpaceSubscription } from '@packages/testing/utils/spaces';
import { v4 } from 'uuid';

import { createCryptoSubscription } from '../createCryptoSubscription';
import { stripeClient } from '../stripe';

jest.doMock('../stripe', () => ({ ...stripeMock }));
jest.mock('lib/loop/loop', () => ({
  getLoopProducts: () => {
    return [loopItemMock];
  }
}));

describe('createCryptoSubscription', () => {
  let space: Space;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace();
    space = generated.space;
  });

  it(`Should return a valid loop checkout url`, async () => {
    const spaceId = space.id;
    (stripeClient.subscriptions.create as jest.Mock<any, any>) = stripeMock.stripeClient.subscriptions.create;
    (stripeClient.prices.list as jest.Mock<any, any>) = stripeMock.stripeClient.prices.list;
    (stripeClient.subscriptions.search as jest.Mock<any, any>) = stripeMock.stripeClient.subscriptions.search;
    (stripeClient.customers.search as jest.Mock<any, any>) = stripeMock.stripeClient.customers.search;
    (stripeClient.customers.create as jest.Mock<any, any>) = stripeMock.stripeClient.customers.create;
    (stripeClient.customers.update as jest.Mock<any, any>) = stripeMock.stripeClient.customers.update;
    (stripeClient.coupons.retrieve as jest.Mock<any, any>) = stripeMock.stripeClient.coupons.retrieve;
    (stripeClient.promotionCodes.list as jest.Mock<any, any>) = stripeMock.stripeClient.promotionCodes.list;
    (stripeClient.paymentMethods.detach as jest.Mock<any, any>) = stripeMock.stripeClient.paymentMethods.detach;
    (stripeClient.paymentMethods.list as jest.Mock<any, any>) = stripeMock.stripeClient.paymentMethods.list;

    await addSpaceSubscription({
      spaceId,
      subscriptionId: v4()
    });

    const url = await createCryptoSubscription({
      billingEmail: 'test@gmail.com',
      period: 'monthly',
      blockQuota: 10,
      coupon: 'test',
      name: 'test',
      spaceId
    });

    expect(typeof url === 'string').toBeTruthy();
    expect(!!url).toBeTruthy();
  });

  it(`Should fail if no space`, async () => {
    const spaceId = v4();

    await expect(
      createCryptoSubscription({
        billingEmail: 'test@gmail.com',
        period: 'monthly',
        blockQuota: 10,
        coupon: 'test',
        name: 'test',
        spaceId
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
