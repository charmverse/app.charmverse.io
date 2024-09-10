import { isAddress } from 'viem';

import { randomETHWalletAddress } from '../generateStubs';

describe('randomETHWalletAddress', () => {
  it('should return a random lowercase ETH wallet address', () => {
    const address = randomETHWalletAddress();
    // Lowercase check
    expect(address).toBe(address.toLowerCase());

    // Address validity check
    expect(isAddress(address)).toBe(true);
  });
});
