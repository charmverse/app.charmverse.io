import { v4 } from 'uuid';

import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { addSpaceSubscription } from 'testing/utils/spaces';

import { communityProduct } from '../constants';
import { getSpaceSubscription } from '../getSpaceSubscription';

describe('getSpaceSubscription', () => {
  it(`Should return null if space subscription doesn't exist`, async () => {
    const { space } = await generateUserAndSpaceWithApiToken();

    const spaceSubscription = await getSpaceSubscription({ spaceId: space.id });

    expect(spaceSubscription).toBeNull();
  });

  it(`Should return space subscription metadata`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();

    const subscriptionId = v4();

    await addSpaceSubscription({
      spaceId: space.id,
      subscriptionId,
      createdBy: user.id,
      period: 'monthly',
      productId: communityProduct.id
    });

    const spaceSubscription = await getSpaceSubscription({ spaceId: space.id });

    expect(spaceSubscription).toMatchObject(
      expect.objectContaining({
        subscriptionId,
        period: 'monthly',
        spaceId: space.id,
        productId: 'community'
      })
    );
  });
});
