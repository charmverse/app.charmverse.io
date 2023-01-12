import { utils } from 'ethers';

import { randomETHWalletAddress } from 'testing/generateStubs';

describe('randomETHWalletAddress', () => {
  it('should return a random lowercase ETH wallet address', () => {
    const address = randomETHWalletAddress();
    // Lowercase check
    expect(address).toBe(address.toLowerCase());

    // Address validity check
    expect(utils.isAddress(address)).toBe(true);
  });
});
