import type { Space } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { InvalidStateError } from '@packages/nextjs/errors';
import { stripeMock, stripeMockIds } from '@packages/testing/stripeMock';
import { addSpaceSubscription } from '@packages/testing/utils/spaces';
import { v4 } from 'uuid';

import { stripeClient } from '../stripe';
import { upgradeProSubscription } from '../upgradeProSubscription';

jest.doMock('../stripe', () => ({ ...stripeMock }));

describe('upgradeProSubscription', () => {
  let space: Space;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace();
    space = generated.space;
  });

  it(`Should upgrade an active stripe subscription`, async () => {
    const customerId = `cus_${v4()}`;
    const subscriptionId = `sub_${v4()}`;
    const spaceId = space.id;

    const stripeSubscriptionDetails = {
      id: subscriptionId,
      status: 'active',
      metadata: {
        spaceId
      },
      customer: {
        id: customerId,
        deleted: undefined,
        metadata: {
          spaceId
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
      }
    };

    (stripeClient.subscriptions.retrieve as jest.Mock) = jest.fn().mockResolvedValue(stripeSubscriptionDetails);
    (stripeClient.subscriptions.update as jest.Mock) = stripeMock.stripeClient.subscriptions.update;
    (stripeClient.prices.list as jest.Mock<any, any>) = stripeMock.stripeClient.prices.list;

    await addSpaceSubscription({
      spaceId,
      subscriptionId,
      customerId,
      deletedAt: null
    });

    await expect(
      upgradeProSubscription({
        spaceId,
        payload: { blockQuota: 100, period: 'monthly' }
      })
    ).resolves.not.toThrow();
  });

  it(`Should fail if the space has no subscription`, async () => {
    const spaceId = v4();

    await expect(
      upgradeProSubscription({
        spaceId,
        payload: { blockQuota: 100, period: 'monthly' }
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });
});
