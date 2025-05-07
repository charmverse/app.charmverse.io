import { prisma } from '@charmverse/core/prisma-client';
import { sessionUserRelations } from '@packages/profile/constants';
import { InvalidInputError } from '@packages/utils/errors';
import { uid } from '@packages/utils/strings';
import { v4 } from 'uuid';

import { disconnectGoogleAccount } from '../disconnectGoogleAccount';

describe('disconnectGoogleAccount', () => {
  it('should delete the google account from the user profile and return the updated user, updating their username to another identity', async () => {
    const walletAddress = `0x${v4()}`;

    const user = await prisma.user.create({
      data: {
        path: uid(),
        username: 'Test user',
        wallets: {
          create: {
            address: walletAddress
          }
        },
        googleAccounts: {
          create: {
            email: `test-${v4()}@example.com`,
            name: 'Test User',
            avatarUrl: 'https://example.com/avatar.png'
          }
        }
      },
      include: sessionUserRelations
    });

    const userAfterDisconnect = await disconnectGoogleAccount({
      googleAccountEmail: user.googleAccounts[0].email,
      userId: user.id
    });

    expect(userAfterDisconnect.username).toEqual(walletAddress);
    expect(userAfterDisconnect.googleAccounts.length).toEqual(0);
  });

  it('should update the users username and identity type to another connected identity, after deleting Google account', async () => {
    const user = await prisma.user.create({
      data: {
        path: uid(),
        username: 'Test user',
        wallets: {
          create: {
            address: `0x${v4()}`
          }
        },
        googleAccounts: {
          create: {
            email: `test-${v4()}@example.com`,
            name: 'Test User',
            avatarUrl: 'https://example.com/avatar.png'
          }
        }
      },
      include: sessionUserRelations
    });

    const userAfterDisconnect = await disconnectGoogleAccount({
      googleAccountEmail: user.googleAccounts[0].email,
      userId: user.id
    });

    expect(userAfterDisconnect.googleAccounts.length).toEqual(0);
    expect(userAfterDisconnect.identityType).toBe('Wallet');
    expect(userAfterDisconnect.username).toBe(userAfterDisconnect.wallets[0].address);
  });

  it('should throw an error if the google account or user id are missing', async () => {
    await expect(
      disconnectGoogleAccount({ googleAccountEmail: 'test@example.com', userId: undefined as any })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      disconnectGoogleAccount({ googleAccountEmail: undefined as any, userId: '123' })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
