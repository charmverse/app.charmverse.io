import { prisma } from '@charmverse/core/prisma-client';
import { sessionUserRelations } from '@packages/profile/constants';
import { randomETHWalletAddress } from '@packages/testing/generateStubs';
import { uid } from '@packages/utils/strings';
import { v4 } from 'uuid';

import { countConnectableIdentities } from '../countConnectableIdentities';

describe('countConnectableIdentities', () => {
  it('should return the number of connected identities', async () => {
    // 0 ID
    const userWithNoIdentities = await prisma.user.create({
      data: {
        username: 'userWithNoIdentities',
        path: uid()
      },
      include: sessionUserRelations
    });
    let count = countConnectableIdentities(userWithNoIdentities);
    expect(count).toBe(0);

    // 1 ID
    const userWithOneIdentity = await prisma.user.create({
      data: {
        path: uid(),
        username: 'userWithOneIdentity',
        wallets: {
          create: {
            address: randomETHWalletAddress()
          }
        }
      },
      include: sessionUserRelations
    });
    count = countConnectableIdentities(userWithOneIdentity);
    expect(count).toBe(1);

    // 2 ID
    const userWithTwoIdentities = await prisma.user.create({
      data: {
        path: uid(),
        username: 'userWithNoIdentities',
        wallets: {
          create: {
            address: randomETHWalletAddress()
          }
        },
        googleAccounts: {
          create: {
            email: `test2-${v4()}@example.com`,
            name: 'test user',
            avatarUrl: 'https://example.com/avatar.png'
          }
        }
      },
      include: sessionUserRelations
    });

    count = countConnectableIdentities(userWithTwoIdentities);
    expect(count).toBe(2);

    // 4 ID
    const userWithFourIdentities = await prisma.user.create({
      data: {
        path: uid(),
        username: 'userWithOneIdentities',
        wallets: {
          create: {
            address: randomETHWalletAddress()
          }
        },
        googleAccounts: {
          create: {
            email: `test4-${v4()}@example.com`,
            name: 'test user',
            avatarUrl: 'https://example.com/avatar.png'
          }
        }
      },
      include: sessionUserRelations
    });
    count = countConnectableIdentities(userWithFourIdentities);
    expect(count).toBe(2);

    // 5 ID
    const userWithFiveIdentities = await prisma.user.create({
      data: {
        path: uid(),
        username: 'userWithOneIdentities',
        wallets: {
          create: {
            address: randomETHWalletAddress()
          }
        },
        googleAccounts: {
          create: {
            email: `test5-${v4()}@example.com`,
            name: 'test user',
            avatarUrl: 'https://example.com/avatar.png'
          }
        },
        discordUser: {
          create: {
            discordId: `1234567890-${Math.random()}`,
            account: {}
          }
        }
      },
      include: sessionUserRelations
    });
    count = countConnectableIdentities(userWithFiveIdentities);
    expect(count).toBe(3);
    // 6 ID
    const userWithSixIdentities = await prisma.user.create({
      data: {
        path: uid(),
        username: 'userWithSixIdentities',
        wallets: {
          create: {
            address: randomETHWalletAddress()
          }
        },
        googleAccounts: {
          create: {
            email: `test6-${v4()}@example.com`,
            name: 'test user',
            avatarUrl: 'https://example.com/avatar.png'
          }
        },
        discordUser: {
          create: {
            discordId: `1234567890${Math.random()}`,
            account: {}
          }
        },
        verifiedEmails: {
          create: {
            avatarUrl: '',
            email: `test-${v4()}@example.com`,
            name: 'test user'
          }
        }
      },
      include: sessionUserRelations
    });
    count = countConnectableIdentities(userWithSixIdentities);
    expect(count).toBe(4);
  });

  it('should ignore Telegram as we cannot login with this identity', async () => {
    const userWithTelegramIdentity = await prisma.user.create({
      data: {
        path: uid(),
        username: 'userWithOneIdentity',
        identityType: 'Telegram',
        telegramUser: {
          create: {
            account: {
              username: 'Empty'
            },
            telegramId: Math.round(Math.random() * 1000000000)
          }
        }
      },
      include: sessionUserRelations
    });

    expect(countConnectableIdentities(userWithTelegramIdentity)).toBe(0);
  });
});
