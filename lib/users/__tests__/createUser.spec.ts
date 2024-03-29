import { prisma } from '@charmverse/core/prisma-client';

import { shortWalletAddress } from 'lib/utils/blockchain';
import { randomETHWalletAddress } from 'testing/generateStubs';

import { createOrGetUserFromWallet, createUserFromWallet } from '../createUser';

jest.mock('lib/blockchain/getENSName', () => {
  return {
    getENSName: (address: string) => {
      if (address.match('include')) {
        return `testname-${address}.eth`;
      }
      return null;
    },
    getENSDetails: (address?: string | null) => {
      if (address?.match('include')) {
        return {
          description: 'New guy in town',
          discord: 'VVV#1234',
          github: 'https://github.com/charmverse',
          twitter: 'https://twitter.com/charmverse'
        };
      }
      return null;
    }
  };
});

afterAll(async () => {
  jest.resetModules();
});

describe('createOrGetUserFromWallet', () => {
  it('Should get existing user based on wallet address', async () => {
    const address = randomETHWalletAddress();
    await createUserFromWallet({ address });

    const { isNew, user } = await createOrGetUserFromWallet({ address });
    expect(isNew).toBe(false);
    expect(user.wallets.length).toBe(1);
  });

  it('Should convert an unclaimed user to claimed', async () => {
    const address = randomETHWalletAddress();
    const { id: userId } = await createUserFromWallet({ address });
    await prisma.user.update({
      where: { id: userId },
      data: { claimed: false }
    });

    await createOrGetUserFromWallet({ address });
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId }
    });

    expect(user.claimed).toBe(true);
  });
});

describe('createUserFromWallet', () => {
  it('should create the user with their shortened web3 address as their username', async () => {
    const address = randomETHWalletAddress();

    const user = await createUserFromWallet({ address });

    expect(user.wallets.length).toBe(1);
    expect(user.wallets[0].address).toBe(address.toLowerCase());
    expect(user.username).toBe(shortWalletAddress(address.toLowerCase()));
    expect(user.username.length).toBe(11);
  });
  it('should assign the user ens name as their username automatically if this exists', async () => {
    const address = `include-${randomETHWalletAddress()}`;

    const user = await createUserFromWallet({ address });

    expect(user.wallets[0].ensname).toBe(`testname-${address}.eth`);
    expect(user.username).toBe(`testname-${address}.eth`);
  });
});
