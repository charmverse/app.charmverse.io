import { prisma } from 'db';
import { sessionUserRelations } from 'lib/session/config';

import { countConnectedIdentities } from '../countConnectedIdentities';

describe('countConnectedIdentities', () => {
  it('should return the number of connected identities', async () => {
    // 0 ID
    const userWithNoIdentities = await prisma.user.create({
      data: {
        username: 'userWithNoIdentities'
      },
      include: sessionUserRelations
    });
    let count = countConnectedIdentities(userWithNoIdentities);
    expect(count).toBe(0);

    // 1 ID
    const userWithOneIdentity = await prisma.user.create({
      data: {
        username: 'userWithOneIdentity',
        wallets: {
          create: {
            address: '0x1'
          }
        }
      },
      include: sessionUserRelations
    });
    count = countConnectedIdentities(userWithOneIdentity);
    expect(count).toBe(1);

    // 2 ID
    const userWithTwoIdentities = await prisma.user.create({
      data: {
        username: 'userWithNoIdentities',
        wallets: {
          create: {
            address: '0x2'
          }
        },
        googleAccounts: {
          create: {
            email: 'test2@example.com',
            name: 'test user',
            avatarUrl: 'https://example.com/avatar.png'
          }
        }
      },
      include: sessionUserRelations
    });

    count = countConnectedIdentities(userWithTwoIdentities);
    expect(count).toBe(2);

    // 4 ID
    const userWithFourIdentities = await prisma.user.create({
      data: {
        username: 'userWithOneIdentities',
        wallets: {
          create: {
            address: '0x4'
          }
        },
        googleAccounts: {
          create: {
            email: 'test4@example.com',
            name: 'test user',
            avatarUrl: 'https://example.com/avatar.png'
          }
        },
        unstoppableDomains: {
          createMany: {
            data: [
              {
                domain: 'example4a.nft'
              },
              {
                domain: 'example4b.nft'
              }
            ]
          }
        }
      },
      include: sessionUserRelations
    });
    count = countConnectedIdentities(userWithFourIdentities);
    expect(count).toBe(4);

    // 5 ID
    const userWithFiveIdentities = await prisma.user.create({
      data: {
        username: 'userWithOneIdentities',
        wallets: {
          create: {
            address: '0x5'
          }
        },
        googleAccounts: {
          create: {
            email: 'test5@example.com',
            name: 'test user',
            avatarUrl: 'https://example.com/avatar.png'
          }
        },
        unstoppableDomains: {
          createMany: {
            data: [
              {
                domain: 'example5a.nft'
              },
              {
                domain: 'example5b.nft'
              }
            ]
          }
        },
        discordUser: {
          create: {
            discordId: '1234567890',
            account: {}
          }
        }
      },
      include: sessionUserRelations
    });
    count = countConnectedIdentities(userWithFiveIdentities);
    expect(count).toBe(5);
  });
});
