import { testUtilsUser } from '@charmverse/core/test';
import { NotFoundError } from '@root/lib/middleware';
import { v4 } from 'uuid';

import { getSpaceAndSubscription } from 'testing/getSpaceSubscription';
import { stripeMock } from 'testing/stripeMock';
import { addSpaceSubscription } from 'testing/utils/spaces';

import { deleteProSubscription } from '../deleteProSubscription';
import { stripeClient } from '../stripe';

jest.doMock('../stripe', () => ({ ...stripeMock }));

describe('deleteProSubscription', () => {
  it(`Should delete a pro subscription from our database`, async () => {
    const customerId = `cus_${v4()}`;
    const subscriptionId = `sub_${v4()}`;
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    (stripeClient.subscriptions.cancel as jest.Mock) = stripeMock.stripeClient.subscriptions.cancel;
    (stripeClient.subscriptions.retrieve as jest.Mock) = stripeMock.stripeClient.subscriptions.retrieve;

    await addSpaceSubscription({
      spaceId: space.id,
      customerId,
      subscriptionId
    });

    await deleteProSubscription({
      spaceId: space.id,
      userId: user.id
    });

    const spaceSubscription = await getSpaceAndSubscription(space.id);
    const subscription = spaceSubscription?.stripeSubscription?.[0];

    expect(spaceSubscription?.paidTier).toBe('cancelled');
    expect(!!subscription?.deletedAt).toBeTruthy();
  });
});
