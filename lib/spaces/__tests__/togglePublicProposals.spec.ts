import { InvalidInputError } from '@charmverse/core/errors';
import { testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { toggleSpacePublicProposals } from '../toggleSpacePublicProposals';

describe('togglePublicProposals', () => {
  it('should update the public proposal flag of a space', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    const afterUpdate = await toggleSpacePublicProposals({
      publicProposals: true,
      spaceId: space.id
    });

    expect(afterUpdate.publicProposals).toBe(true);

    const afterSecondUpdate = await toggleSpacePublicProposals({
      publicProposals: false,
      spaceId: space.id
    });

    expect(afterSecondUpdate.publicProposals).toBe(false);
  });

  it('should throw an error if spaceId is invalid', async () => {
    await expect(
      toggleSpacePublicProposals({
        publicProposals: true,
        spaceId: 'invalid'
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should throw an error if publicProposals is invalid', async () => {
    await expect(
      toggleSpacePublicProposals({
        publicProposals: null as any,
        spaceId: v4()
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
