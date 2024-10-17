import { GET, POST } from '@packages/utils/http';

export async function getWalletGasBalanceInUSD(
  walletAddress: string,
  apiKey: string | undefined = process.env.ALCHEMY_API_KEY
) {
  if (!apiKey) {
    throw new Error('No Alchemy API key found');
  }
  const alchemyApiUrl = `https://opt-mainnet.g.alchemy.com/v2/${apiKey}`;

  const response = await POST<{ result: string }>(alchemyApiUrl, {
    jsonrpc: '2.0',
    method: 'eth_getBalance',
    params: [walletAddress, 'latest'],
    id: 1
  });

  if (!response.result) {
    throw new Error('Unable to fetch the balance');
  }

  const balanceWei = response.result;
  const balanceEth = parseInt(balanceWei, 16) / 10 ** 18;

  const priceResponse = await GET<{ ethereum: { usd: number } }>('https://api.coingecko.com/api/v3/simple/price', {
    ids: 'ethereum',
    vs_currencies: 'usd'
  });
  const ethPriceInUSD = priceResponse.ethereum.usd;

  const balanceInUSD = balanceEth * ethPriceInUSD;

  return balanceInUSD;
}
