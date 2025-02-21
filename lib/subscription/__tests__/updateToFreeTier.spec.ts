import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import { testUtilsUser } from '@charmverse/core/test';
import { stripeMock, stripeMockIds } from '@packages/testing/stripeMock';
import { addSpaceSubscription } from '@packages/testing/utils/spaces';
import { v4 } from 'uuid';

import { stripeClient } from '../stripe';
import { updateToFreeTier } from '../updateToFreeTier';

jest.doMock('../stripe', () => ({ ...stripeMock }));

describe('updateProSubscription', () => {
  it(`Should update an active stripe subscription`, async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const customerId = `cus_${v4()}`;
    const subscriptionId = `sub_${v4()}`;
    const spaceId = space.id;
    const userId = user.id;

    const stripeSubscriptionDetails = {
      id: subscriptionId,
      status: 'active',
      metadata: {
        spaceId
      },
      items: {
        data: [
          {
            price: stripeMockIds.priceId,
            quantity: 10
          }
        ]
      },
      customer: {
        id: customerId,
        deleted: undefined,
        metadata: {
          spaceId
        }
      }
    };

    (stripeClient.subscriptions.retrieve as jest.Mock) = jest.fn().mockResolvedValue(stripeSubscriptionDetails);
    (stripeClient.subscriptions.cancel as jest.Mock) = stripeMock.stripeClient.subscriptions.cancel;

    await addSpaceSubscription({
      spaceId,
      subscriptionId,
      customerId,
      deletedAt: null
    });

    await expect(updateToFreeTier(spaceId, userId)).resolves.not.toThrow();
  });

  it(`Should update to free tier even if space does not have active subscription`, async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const spaceId = space.id;
    const userId = user.id;

    await expect(updateToFreeTier(spaceId, userId)).resolves.not.toThrow();
  });

  it(`Should fail to update the space if it is on the Enterprise plan`, async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({ spacePaidTier: 'enterprise' });

    await expect(updateToFreeTier(space.id, user.id)).rejects.toBeInstanceOf(InvalidInputError);
  });

  it(`Should fail if the space does not exist`, async () => {
    const spaceId = v4();
    const userId = v4();

    (stripeClient.subscriptions.retrieve as jest.Mock) = jest
      .fn()
      .mockResolvedValue(stripeMock.stripeClient.subscriptions.retrieve);

    await expect(updateToFreeTier(spaceId, userId)).rejects.toBeInstanceOf(DataNotFoundError);
  });
});
