import { prisma } from '@charmverse/core/prisma-client';
import { sessionUserRelations } from '@packages/profile/constants';
import type { LoggedInUser } from '@packages/profile/getUser';
import { getUserProfile } from '@packages/profile/getUser';
import { InvalidInputError, MissingDataError } from '@packages/utils/errors';
import { uid } from '@packages/utils/strings';
import { v4 } from 'uuid';

let user: LoggedInUser;
const walletAddress = `0x${v4()}`;

beforeAll(async () => {
  user = await prisma.user.create({
    data: {
      path: uid(),
      username: 'userWithOneIdentities',
      wallets: {
        create: {
          address: walletAddress
        }
      },
      googleAccounts: {
        create: {
          email: `test-${v4()}test5@example.com`,
          name: 'test user',
          avatarUrl: 'https://example.com/avatar.png'
        }
      },
      discordUser: {
        create: {
          discordId: `1234567890-${v4()}`,
          account: {}
        }
      }
    },
    include: sessionUserRelations
  });

  if (!user.discordUser || !user.wallets.length || !user.googleAccounts.length) {
    throw new InvalidInputError('User session relations not retrieved correctly');
  }
});

describe('getUserProfile', () => {
  it('should return a user based on userId along with all session data', async () => {
    const foundUser = await getUserProfile('id', user.id);

    expect(foundUser).toMatchObject(expect.objectContaining(user));
  });

  it('should return a user based on wallet address along with all session data', async () => {
    const foundUser = await getUserProfile('addresses', walletAddress);

    expect(foundUser).toMatchObject(expect.objectContaining(user));
  });

  it('should throw an error if the user does not exist', async () => {
    await expect(getUserProfile('id', v4())).rejects.toBeInstanceOf(MissingDataError);
  });
});
