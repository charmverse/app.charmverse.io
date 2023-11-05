import { prisma } from '@charmverse/core/prisma-client';

import { randomETHWalletAddress } from 'lib/utilities/blockchain';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { lensClient } from '../../lens/lensClient';
import { getDefaultLensProfile } from '../getDefaultLensProfile';

jest.mock('../../lens/lensClient', () => ({
  lensClient: {
    profile: {
      fetchAll: jest.fn().mockImplementation(() =>
        Promise.resolve({
          items: []
        })
      )
    }
  }
}));

describe('getDefaultLensProfile', () => {
  it(`Should return null if there are no wallets connected for the user`, async () => {
    const generated = await generateUserAndSpaceWithApiToken();
    const user = generated.user;

    const defaultLensProfile = await getDefaultLensProfile(user.id);
    expect(defaultLensProfile).toBeNull();
  });

  it(`Should return null if no connected wallets have a default lens profile attached`, async () => {
    const generated = await generateUserAndSpaceWithApiToken({ walletAddress: randomETHWalletAddress() });
    const user = generated.user;

    const defaultLensProfile = await getDefaultLensProfile(user.id);
    expect(defaultLensProfile).toBeNull();
  });

  it(`Should return default lens profile for user's wallet`, async () => {
    const firstWallet = randomETHWalletAddress();
    const secondWallet = randomETHWalletAddress();
    const generated = await generateUserAndSpaceWithApiToken({ walletAddress: firstWallet });
    const user = generated.user;

    await prisma.userWallet.create({
      data: {
        userId: user.id,
        address: secondWallet
      }
    });

    lensClient.profile.fetchAll = jest.fn().mockImplementation((address: string) => {
      if (address === firstWallet) {
        return Promise.resolve({
          items: []
        });
      }

      return Promise.resolve({
        items: [
          {
            id: 'test-1',
            isDefault: false
          },
          {
            id: 'test-2',
            isDefault: true
          }
        ]
      });
    });

    const defaultLensProfile = await getDefaultLensProfile(user.id);
    expect(defaultLensProfile?.id).toBe('test-2');
  });
});
