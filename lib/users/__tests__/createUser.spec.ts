import { shortWalletAddress } from 'lib/utilities/strings';
import { randomETHWalletAddress } from 'testing/generateStubs';

import { createUserFromWallet } from '../createUser';

jest.mock('lib/blockchain/getENSName', () => {
  return {
    getENSName: (address: string) => {
      if (address.match('include')) {
        return `testname-${address}.eth`;
      }
      return null;
    }
  };
});

afterAll(async () => {
  jest.resetModules();
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
