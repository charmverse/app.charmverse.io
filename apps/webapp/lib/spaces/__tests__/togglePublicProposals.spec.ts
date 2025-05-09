import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
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

  it('should delete any public proposal invites if deactivating public proposals', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({
      publicProposals: true
    });

    const privateLink = await prisma.inviteLink.create({
      data: {
        code: v4(),
        createdBy: user.id,
        spaceId: space.id
      }
    });

    const publicProposalLink = await prisma.inviteLink.create({
      data: {
        code: v4(),
        createdBy: user.id,
        spaceId: space.id,
        visibleOn: 'proposals'
      }
    });

    // Make sure we don't accidentally delete invites when activating public proposals
    await toggleSpacePublicProposals({
      publicProposals: true,
      spaceId: space.id
    });
    const spaceInvites = await prisma.inviteLink.findMany({
      where: {
        spaceId: space.id
      }
    });

    expect(spaceInvites.length).toBe(2);

    // Deactivate the public invite
    await toggleSpacePublicProposals({
      publicProposals: false,
      spaceId: space.id
    });

    const spaceInvitesAfterUpdate = await prisma.inviteLink.findMany({
      where: {
        spaceId: space.id
      }
    });

    expect(spaceInvitesAfterUpdate.length).toBe(1);
    expect(spaceInvitesAfterUpdate[0].id).toBe(privateLink.id);
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
