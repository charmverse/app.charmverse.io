import { prisma } from '@charmverse/core/prisma-client';
import { Wallet } from 'ethers';

import { getENSDetails } from 'lib/blockchain';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { getEnsProfile } from '../getEnsProfile';

jest.mock('../../blockchain/getENSName', () => ({
  getENSDetails: jest.fn().mockResolvedValue({
    avatar: 'https://test-avatar.png',
    description: 'my bio',
    discord: null,
    github: null,
    twitter: null,
    reddit: null,
    linkedin: null,
    emails: null
  }),
  getENSName: jest.fn().mockImplementation(() => Promise.resolve(null))
}));

describe('getEnsProfile', () => {
  it(`Should return null if there are no wallets connected for the user`, async () => {
    const generated = await generateUserAndSpaceWithApiToken();
    const user = generated.user;

    const ensProfile = await getEnsProfile({ userId: user.id });
    expect(ensProfile).toBeNull();
  });

  it(`Should return null if no wallets of the user has ens attached`, async () => {
    const generated = await generateUserAndSpaceWithApiToken({ walletAddress: Wallet.createRandom().address });
    const user = generated.user;

    const ensProfile = await getEnsProfile({ userId: user.id });
    expect(ensProfile).toBeNull();
  });

  it(`Should return the ens profile of the first wallet of the user`, async () => {
    const generated = await generateUserAndSpaceWithApiToken({ walletAddress: Wallet.createRandom().address });
    const user = generated.user;

    await prisma.userWallet.create({
      data: {
        userId: user.id,
        address: Wallet.createRandom().address,
        ensname: 'test.eth'
      }
    });

    const ensProfile = await getEnsProfile({ userId: user.id });
    expect(getENSDetails).toHaveBeenCalledWith('test.eth');
    expect(ensProfile).not.toBeNull();
  });
});
