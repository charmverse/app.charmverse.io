import { v4 } from 'uuid';

import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { getSpaceSubscription } from '../getSpaceSubscription';
import { stripeClient } from '../stripe';

jest.mock('../stripe', () => ({
  stripeClient: {
    subscriptions: {
      retrieve: jest.fn()
    }
  }
}));

describe('getSpaceSubscription', () => {
  it(`Should return null if space subscription doesn't exist`, async () => {
    const { space } = await generateUserAndSpaceWithApiToken();

    const spaceSubscription = await getSpaceSubscription({ spaceId: space.id });

    expect(spaceSubscription).toBeNull();
  });

  it(`Should return space subscription metadata`, async () => {
    const { space } = await generateUserAndSpaceWithApiToken();

    const subscriptionId = v4();

    await prisma.space.update({
      data: {
        subscriptionId
      },
      where: {
        id: space.id
      }
    });

    const retrieveSubscriptionsMockFn = jest.fn().mockResolvedValue({
      metadata: {
        usage: 1,
        period: 'monthly',
        tier: 'pro',
        spaceId: space.id
      }
    });

    (stripeClient.subscriptions.retrieve as jest.Mock<any, any>) = retrieveSubscriptionsMockFn;

    const spaceSubscription = await getSpaceSubscription({ spaceId: space.id });

    expect(retrieveSubscriptionsMockFn).toHaveBeenCalledWith(subscriptionId);

    expect(spaceSubscription).toStrictEqual({
      usage: 1,
      period: 'monthly',
      tier: 'pro',
      spaceId: space.id
    });
  });
});
