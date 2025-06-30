import { randomETHWalletAddress } from '../random';

describe('randomETHWallet', () => {
  it('should generate a lowercase ETH wallet address', () => {
    const wallet = randomETHWalletAddress();

    expect(wallet).toMatch(/^0x[a-f0-9]{40,}$/);
  });
});
