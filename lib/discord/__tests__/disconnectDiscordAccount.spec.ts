import { prisma } from '@charmverse/core/prisma-client';
import { uid } from '@packages/utils/strings';
import { sessionUserRelations } from '@root/lib/session/config';
import { InvalidInputError } from '@root/lib/utils/errors';
import { v4 } from 'uuid';

import { disconnectDiscordAccount } from '../disconnectDiscordAccount';

describe('disconnectdiscordAccount', () => {
  it('should delete the discord account from the user profile and return the updated user, updating their username to another identity', async () => {
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
        discordUser: {
          create: {
            discordId: v4(),
            account: {}
          }
        }
      },
      include: sessionUserRelations
    });

    const userAfterDisconnect = await disconnectDiscordAccount({
      userId: user.id
    });

    expect(userAfterDisconnect.username).toEqual(walletAddress);
    expect(userAfterDisconnect.discordUser).toBeNull();
  });
  it('should update the users username and identity type to another connected identity, after deleting Discord account', async () => {
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
        discordUser: {
          create: {
            discordId: v4(),
            account: {}
          }
        }
      },
      include: sessionUserRelations
    });

    const userAfterDisconnect = await disconnectDiscordAccount({
      userId: user.id
    });

    expect(userAfterDisconnect.discordUser).toBeNull();
    expect(userAfterDisconnect.identityType).toBe('Wallet');
    expect(userAfterDisconnect.username).toBe(userAfterDisconnect.wallets[0].address);
  });

  it('should throw an error if user id is missing', async () => {
    await expect(disconnectDiscordAccount({ userId: null as any })).rejects.toBeInstanceOf(InvalidInputError);
  });
});
