import { v4 } from 'uuid';

import { NotFoundError } from 'lib/middleware';
import { loopItemMock, stripeMock, stripeMockIds } from 'testing/stripeMock';

import { createCryptoSubscription } from '../createCryptoSubscription';
import { stripeClient } from '../stripe';

jest.doMock('../stripe', () => ({ ...stripeMock }));

jest.mock('lib/loop/loop', () => ({
  getLoopProducts: jest.fn().mockResolvedValue([loopItemMock])
}));

describe('createCryptoSubscription', () => {
  it(`Should return a valid loop checkout url`, async () => {
    (stripeClient.subscriptions.retrieve as jest.Mock) = stripeMock.stripeClient.subscriptions.retrieve;
    (stripeClient.customers.update as jest.Mock) = stripeMock.stripeClient.customers.update;

    const url = await createCryptoSubscription({
      subscriptionId: stripeMockIds.subscriptionId,
      email: 'test@gmail.com'
    });

    expect(url).not.toBeNull();
  });
  it(`Should fail if no loop item`, async () => {
    const subscriptionId = v4();

    (stripeClient.subscriptions.retrieve as jest.Mock) = jest.fn().mockResolvedValue({
      id: subscriptionId,
      status: 'incomplete',
      customer: stripeMockIds.customerId,
      items: {
        data: [
          {
            price: {
              id: v4()
            },
            quantity: 10
          }
        ]
      }
    });

    await expect(
      createCryptoSubscription({
        subscriptionId,
        email: 'test@gmail.com'
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
