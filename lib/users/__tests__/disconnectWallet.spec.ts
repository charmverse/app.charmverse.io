import { prisma } from 'db';
import { sessionUserRelations } from 'lib/session/config';

import { disconnectWallet } from '../disconnectWallet';

// test to check if the disconnectWallet function works as expected
describe('disconnectWallet', () => {
  it('should disconnect the wallet from the user', async () => {
    const walletAddress = '0x1';
    // create a user with a wallet
    const user = await prisma.user.create({
      data: {
        path: `${Math.random()}`,
        username: 'userWithOneIdentity',
        wallets: {
          create: {
            address: walletAddress,
            ensname: 'test.eth'
          }
        },
        profileItems: {
          createMany: {
            data: [
              {
                id: '0x1234',
                type: 'nft',
                isHidden: false,
                isPinned: true
              },
              {
                id: '012345',
                type: 'community',
                isHidden: false,
                isPinned: true
              }
            ]
          }
        }
      },
      include: sessionUserRelations
    });

    // disconnect the wallet from the user
    const loggedInUser = await disconnectWallet({ userId: user.id, address: walletAddress });
    const profileItems = await prisma.profileItem.findMany({
      where: {
        userId: user.id,
        id: {
          in: ['0x1234', '012345']
        }
      }
    });

    // check if the wallet is disconnected from the user
    expect(loggedInUser.wallets.find((wallet) => wallet.address === walletAddress)).toBeUndefined();
    expect(profileItems).toHaveLength(0);
  });
});
