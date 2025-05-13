import { prisma } from '@charmverse/core/prisma-client';
import { sessionUserRelations } from '@packages/profile/constants';
import { randomETHWalletAddress } from '@packages/testing/generateStubs';
import { shortWalletAddress } from '@packages/utils/blockchain';
import { InsecureOperationError, InvalidInputError, MissingDataError } from '@packages/utils/errors';
import { uid } from '@packages/utils/strings';
import { v4 } from 'uuid';

import { updateUsedIdentity } from '../updateUsedIdentity';

describe('updateUsedIdentity', () => {
  it('should update the user identity type and username to the first connected identity if no identity is provided in this order: [wallet, discord, google account]', async () => {
    const userWithWalletAndDiscord = await prisma.user.create({
      data: {
        path: uid(),
        username: 'random-name',
        identityType: 'RandomName',
        wallets: {
          create: {
            address: `0x${v4()}`
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

    const userWithWalletAndDiscordAfterUpdate = await updateUsedIdentity(userWithWalletAndDiscord.id);

    expect(userWithWalletAndDiscordAfterUpdate.username).toBe(userWithWalletAndDiscord.wallets[0].address);
    expect(userWithWalletAndDiscordAfterUpdate.identityType).toBe(`Wallet`);

    // --------------
    const userWithDiscord = await prisma.user.create({
      data: {
        path: uid(),
        username: 'random-name',
        identityType: 'RandomName',
        discordUser: {
          create: {
            discordId: `1234567890-${v4()}`,
            account: {
              username: 'Discord Pseudonym'
            }
          }
        }
      },
      include: sessionUserRelations
    });

    const userWithDiscordAfterUpdate = await updateUsedIdentity(userWithDiscord.id);

    expect(userWithDiscordAfterUpdate.username).toBe((userWithDiscord.discordUser?.account as any).username);
    expect(userWithDiscordAfterUpdate.identityType).toBe(`Discord`);

    // --------------
    const userWithGoogle = await prisma.user.create({
      data: {
        path: uid(),
        username: 'random-name',
        identityType: 'RandomName',
        googleAccounts: {
          create: {
            email: `test-${v4()}@example.com`,
            name: 'Test User Google profile',
            avatarUrl: 'https://example.com/avatar.png'
          }
        }
      },
      include: sessionUserRelations
    });

    const userWithGoogleAfterUpdate = await updateUsedIdentity(userWithGoogle.id);

    expect(userWithGoogleAfterUpdate.username).toBe(userWithGoogle.googleAccounts[0].name);
    expect(userWithGoogleAfterUpdate.identityType).toBe(`Google`);
  });

  it('should update a user identity to the short version of the specified Wallet address', async () => {
    const address = randomETHWalletAddress();

    const user = await prisma.user.create({
      data: {
        path: uid(),
        username: 'random-name',
        identityType: 'RandomName',
        wallets: {
          create: {
            address
          }
        }
      },
      include: sessionUserRelations
    });

    const userAfterUpdate = await updateUsedIdentity(user.id, {
      identityType: 'Wallet',
      displayName: user.wallets[0].address
    });

    expect(userAfterUpdate.username).toBe(shortWalletAddress(user.wallets[0].address));
    expect(userAfterUpdate.identityType).toBe(`Wallet`);

    // Reset identity
    await updateUsedIdentity(user.id, {
      identityType: 'RandomName',
      displayName: 'random name'
    });

    // Make sure we support update using shortform version of address
    const userAfterSecondUpdate = await updateUsedIdentity(user.id, {
      identityType: 'Wallet',
      displayName: shortWalletAddress(user.wallets[0].address)
    });

    expect(userAfterSecondUpdate.username).toBe(shortWalletAddress(user.wallets[0].address));
    expect(userAfterSecondUpdate.identityType).toBe(`Wallet`);
  });

  it('should update a user identity to their connected ENS name', async () => {
    const ensname = `example-${v4()}.nft`;

    const user = await prisma.user.create({
      data: {
        path: v4(),
        username: 'random-name',
        identityType: 'RandomName',
        wallets: {
          create: {
            address: v4(),
            ensname
          }
        }
      },
      include: sessionUserRelations
    });

    const userAfterUpdate = await updateUsedIdentity(user.id, {
      identityType: 'Wallet',
      displayName: ensname
    });

    expect(userAfterUpdate.username).toBe(ensname);
    expect(userAfterUpdate.identityType).toBe(`Wallet`);
  });

  it('should update a user identity to their connected Google Account username', async () => {
    const user = await prisma.user.create({
      data: {
        path: uid(),
        username: 'random-name',
        identityType: 'RandomName',
        googleAccounts: {
          create: {
            avatarUrl: 'https://example.com/avatar.png',
            email: `test-${v4()}@example.com`,
            name: 'Test User Google profile'
          }
        }
      },
      include: sessionUserRelations
    });

    const userAfterUpdate = await updateUsedIdentity(user.id, {
      identityType: 'Google',
      displayName: user.googleAccounts[0].name
    });

    expect(userAfterUpdate.username).toBe(user.googleAccounts[0].name);
    expect(userAfterUpdate.identityType).toBe(`Google`);
  });

  it('should update a user identity to their connected Telegram username', async () => {
    const user = await prisma.user.create({
      data: {
        path: uid(),
        username: 'random-name',
        identityType: 'RandomName',
        telegramUser: {
          create: {
            account: {
              username: `Telegram User ${v4()}`
            },
            telegramId: Math.round(Math.random() * 1000000)
          }
        }
      },
      include: sessionUserRelations
    });

    const userAfterUpdate = await updateUsedIdentity(user.id, {
      identityType: 'Telegram',
      displayName: (user.telegramUser?.account as any).username
    });

    expect(userAfterUpdate.username).toBe((user.telegramUser?.account as any).username);
    expect(userAfterUpdate.identityType).toBe(`Telegram`);
  });

  it('should update a user identity to their Verified Email username', async () => {
    const user = await prisma.user.create({
      data: {
        path: uid(),
        username: 'random-name',
        identityType: 'RandomName',
        verifiedEmails: {
          create: {
            name: 'John Doe Email',
            email: `test-${v4()}@example.com`,
            avatarUrl: 'https://example.com/avatar.png'
          }
        }
      },
      include: sessionUserRelations
    });

    const userAfterUpdate = await updateUsedIdentity(user.id, {
      identityType: 'VerifiedEmail',
      displayName: user.verifiedEmails[0].name
    });

    expect(userAfterUpdate.username).toBe(user.verifiedEmails[0].name);
    expect(userAfterUpdate.identityType).toBe(`VerifiedEmail`);
  });

  it('should throw an error if user does not exist', async () => {
    await expect(updateUsedIdentity(v4())).rejects.toBeInstanceOf(MissingDataError);
  });
  it('should throw an error if passing an empty display name', async () => {
    const user = await prisma.user.create({
      data: {
        path: uid(),
        username: 'random-name'
      }
    });
    await expect(
      updateUsedIdentity(user.id, { displayName: null as any, identityType: 'Google' })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should throw an error if passing an invalid identity type', async () => {
    const user = await prisma.user.create({
      data: {
        path: uid(),
        username: 'random-name'
      }
    });
    await expect(
      updateUsedIdentity(user.id, { displayName: 'Test', identityType: 'invalid' as any })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should throw an error if trying to update identity to a non connected identity', async () => {
    const user = await prisma.user.create({
      data: {
        path: uid(),
        username: 'random-name',
        identityType: 'RandomName'
      },
      include: sessionUserRelations
    });

    await expect(
      updateUsedIdentity(user.id, {
        identityType: 'Google',
        displayName: 'test@example.com'
      })
    ).rejects.toBeInstanceOf(InsecureOperationError);

    await expect(
      updateUsedIdentity(user.id, {
        identityType: 'Wallet',
        displayName: '0x123'
      })
    ).rejects.toBeInstanceOf(InsecureOperationError);

    await expect(
      updateUsedIdentity(user.id, {
        identityType: 'Telegram',
        displayName: 'telegram name'
      })
    ).rejects.toBeInstanceOf(InsecureOperationError);
  });
});
