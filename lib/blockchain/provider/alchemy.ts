
export type SupportdChainId = 1 | 4 | 5 | 137 | 80001 | 42161

const alchemyApis: Record<SupportdChainId, string> = {
  1: 'eth-mainnet',
  4: 'eth-rinkeby',
  5: 'eth-goerli',
  137: 'polygon-mainnet',
  80001: 'polygon-mumbai',
  42161: 'arb-mainnet'
};

export const getAlchemyBaseUrl = (chainId: SupportdChainId = 1): string => {
  const apiKey = process.env.ALCHEMY_API_KEY;

  if (!apiKey) {
    throw new Error('No api key provided for Alchemy');
  }

  const apiSubdomain = alchemyApis[chainId];

  if (!apiSubdomain) {
    throw new Error('Chain not supported');
  }

  return `https://${apiSubdomain}.g.alchemy.com/v2/${apiKey}`;
};
