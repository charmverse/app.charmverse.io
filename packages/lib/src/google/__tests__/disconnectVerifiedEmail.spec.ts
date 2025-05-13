import { prisma } from '@charmverse/core/prisma-client';
import { sessionUserRelations } from '@packages/profile/constants';
import { InvalidInputError } from '@packages/utils/errors';
import { uid } from '@packages/utils/strings';
import { v4 } from 'uuid';

import { disconnectVerifiedEmail } from '../disconnectVerifiedEmail';

describe('disconnectVerifiedEmail', () => {
  it('should delete the verified email account from the user profile and return the updated user, updating their username to another identity', async () => {
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
        verifiedEmails: {
          create: {
            email: `test-${v4()}@example.com`,
            name: 'Test User',
            avatarUrl: 'https://example.com/avatar.png'
          }
        }
      },
      include: sessionUserRelations
    });

    const userAfterDisconnect = await disconnectVerifiedEmail({
      email: user.verifiedEmails[0].email,
      userId: user.id
    });

    expect(userAfterDisconnect.username).toEqual(walletAddress);
    expect(userAfterDisconnect.verifiedEmails.length).toEqual(0);
  });

  it('should update the users username and identity type to another connected identity, after deleting verified email account', async () => {
    const user = await prisma.user.create({
      data: {
        username: 'Test user',
        path: uid(),
        wallets: {
          create: {
            address: `0x${v4()}`
          }
        },
        verifiedEmails: {
          create: {
            email: `test-${v4()}@example.com`,
            name: 'Test User',
            avatarUrl: 'https://example.com/avatar.png'
          }
        }
      },
      include: sessionUserRelations
    });

    const userAfterDisconnect = await disconnectVerifiedEmail({
      email: user.verifiedEmails[0].email,
      userId: user.id
    });

    expect(userAfterDisconnect.verifiedEmails.length).toEqual(0);
    expect(userAfterDisconnect.identityType).toBe('Wallet');
    expect(userAfterDisconnect.username).toBe(userAfterDisconnect.wallets[0].address);
  });

  it('should throw an error if the verified email account or user id are missing', async () => {
    await expect(
      disconnectVerifiedEmail({ email: 'test@example.com', userId: undefined as any })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(disconnectVerifiedEmail({ email: undefined as any, userId: '123' })).rejects.toBeInstanceOf(
      InvalidInputError
    );
  });
});
