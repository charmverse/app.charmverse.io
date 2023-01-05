import { Wallet } from 'ethers';
import { v4 } from 'uuid';

import { randomETHWalletAddress } from 'testing/generate-stubs';

import { createUserFromWallet } from '../createUser';

jest.mock('lib/blockchain/getENSName', () => {
  return {
    getENSName: (address: string) => {
      if (address.match('ignore')) {
        return null;
      }
      return `testname-${address}.eth`;
    }
  };
});
afterAll(async () => {
  jest.resetModules();
});

describe('createUserFromWallet', () => {
  it('should create the user with their web3 address as their username', async () => {
    const address = `ignore-${Wallet.createRandom().address}`;

    const user = await createUserFromWallet({ address });

    expect(user.wallets.length).toBe(1);
    expect(user.wallets[0].address).toBe(address.toLowerCase());
    expect(user.username).toBe(address.toLowerCase());
  });
  it('should assign the user ens name as their username automatically if this exists', async () => {
    const address = randomETHWalletAddress();

    const user = await createUserFromWallet({ address });

    expect(user.wallets[0].ensname).toBe(`testname-${address}.eth`);
    expect(user.username).toBe(`testname-${address}.eth`);
  });
});
