import { v4 } from 'uuid';

import { prisma } from 'db';
import { sessionUserRelations } from 'lib/session/config';
import { InvalidInputError } from 'lib/utilities/errors';

import { disconnectGoogleAccount } from '../disconnectGoogleAccount';

describe('disconnectGoogleAccount', () => {
  it('should delete the google account from the user profile and return the updated user, updating their username to another identity', async () => {
    const walletAddress = `0x${v4()}`;

    const user = await prisma.user.create({
      data: {
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

  it('should mark the user as deleted if the Google Account was their only identity', async () => {
    const user = await prisma.user.create({
      data: {
        username: 'Test user',
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

    expect(userAfterDisconnect.deletedAt).toBeInstanceOf(Date);
  });

  it('should update the users username and identity type to another connected identity, after deleting Google account', async () => {
    const user = await prisma.user.create({
      data: {
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
