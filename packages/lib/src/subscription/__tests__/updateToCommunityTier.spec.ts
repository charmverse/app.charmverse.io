import { InvalidInputError } from '@charmverse/core/errors';
import { testUtilsUser } from '@charmverse/core/test';

import { updateToCommunityTier } from '../updateToCommunityTier';

describe('updateToCommunityTier', () => {
  it(`Should update the space to community`, async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({ spacePaidTier: 'free' });

    await expect(updateToCommunityTier(space.id, user.id)).resolves.toMatchObject({
      ...space,
      paidTier: 'community',
      updatedAt: expect.any(Date)
    });
  });

  it(`Should fail to update the space if it is on the Enterprise plan`, async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({ spacePaidTier: 'enterprise' });

    await expect(updateToCommunityTier(space.id, user.id)).rejects.toBeInstanceOf(InvalidInputError);
  });
});
