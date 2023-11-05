import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { getPublicInviteLink } from '../getPublicInviteLink';

describe('getPublicInviteLink', () => {
  it('should always return a public invite link if it exists', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({
      // This parameter invalidates the link, but we still want to make sure it is returned
      publicProposals: false
    });
    const inviteLink = await prisma.inviteLink.create({
      data: {
        visibleOn: 'proposals',
        code: v4(),
        author: {
          connect: {
            id: user.id
          }
        },
        space: {
          connect: {
            id: space.id
          }
        }
      },
      include: {
        space: true
      }
    });

    const foundInvite = await getPublicInviteLink({
      visibleOn: 'proposals',
      spaceId: space.id
    });

    expect(foundInvite).toMatchObject(inviteLink);
  });

  it('should throw an error if the space ID is not a valid UUID', async () => {
    await expect(
      getPublicInviteLink({
        visibleOn: 'proposals',
        spaceId: 'not-a-valid-uuid'
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should throw an error if the public context is not valid', async () => {
    await expect(
      getPublicInviteLink({
        visibleOn: 'bad-context' as any,
        spaceId: v4()
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      getPublicInviteLink({
        visibleOn: undefined as any,
        spaceId: v4()
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should throw an error if the invite link is not found', async () => {
    await expect(
      getPublicInviteLink({
        visibleOn: 'proposals',
        spaceId: v4()
      })
    ).rejects.toBeInstanceOf(DataNotFoundError);
  });
});
