import { jest } from '@jest/globals';

jest.unstable_mockModule('@packages/utils/http', () => ({
  POST: jest.fn(),
  GET: jest.fn()
}));

const { POST, GET } = await import('@packages/utils/http');
const { getWalletGasBalanceInUSD } = await import('../getWalletGasBalanceInUSD');

describe('getWalletGasBalanceInUSD', () => {
  beforeEach(() => {
    process.env.ALCHEMY_API_KEY = 'test-api-key';
  });

  it('should return $25 when balance and price are set accordingly', async () => {
    // Mock the POST request to Alchemy API
    (POST as jest.Mock<typeof POST>).mockResolvedValue({
      result: '0x3635c9adc5dea00000' // 1000000000000000000000 wei (1000 ETH)
    });

    // Mock the GET request to CoinGecko API
    (GET as jest.Mock<typeof GET>).mockResolvedValue({
      ethereum: { usd: 0.025 } // $0.025 per ETH
    });

    const walletAddress = '0x1234567890123456789012345678901234567890';
    const balance = await getWalletGasBalanceInUSD(walletAddress);

    expect(balance).toBeCloseTo(25, 2); // $25 with 2 decimal places precision
    expect(POST).toHaveBeenCalledWith(
      expect.stringContaining('https://opt-mainnet.g.alchemy.com/v2/test-api-key'),
      expect.any(Object)
    );
    expect(GET).toHaveBeenCalledWith('https://api.coingecko.com/api/v3/simple/price', expect.any(Object));
  });
});
