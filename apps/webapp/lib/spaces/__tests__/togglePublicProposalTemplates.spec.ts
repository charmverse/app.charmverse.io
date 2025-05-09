import { InvalidInputError } from '@charmverse/core/errors';
import { testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { toggleSpacePublicProposalTemplates } from '../toggleSpacePublicProposalTemplates';

describe('togglePublicProposals', () => {
  it('should update the public proposal templates flag of a space', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    const afterUpdate = await toggleSpacePublicProposalTemplates({
      publicProposalTemplates: true,
      spaceId: space.id
    });

    expect(afterUpdate.publicProposalTemplates).toBe(true);

    const afterSecondUpdate = await toggleSpacePublicProposalTemplates({
      publicProposalTemplates: false,
      spaceId: space.id
    });

    expect(afterSecondUpdate.publicProposalTemplates).toBe(false);
  });

  it('should throw an error if spaceId is invalid', async () => {
    await expect(
      toggleSpacePublicProposalTemplates({
        publicProposalTemplates: true,
        spaceId: 'invalid'
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should throw an error if publicProposalTemplates is invalid', async () => {
    await expect(
      toggleSpacePublicProposalTemplates({
        publicProposalTemplates: null as any,
        spaceId: v4()
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
