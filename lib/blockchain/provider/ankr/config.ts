import { typedKeys } from 'lib/utils/objects';

// Find supported chains:  https://www.npmjs.com/package/@ankr.com/ankr.js
// Note: we commented out chains already supported by alchemy
export const ankrAdvancedApis = {
  // 1: 'eth',
  // 5: 'eth_goerli',
  // 10: 'optimism',
  56: 'bsc',
  // 137: 'polygon',
  1101: 'polygon_zkevm',
  250: 'fantom',
  // 42161: 'arbitrum',
  43114: 'avalanche',
  5000: 'mantle'
} as const;
// https://docs.alchemy.com/docs/why-use-alchemy#-blockchains-supported
export const supportedChainIds = typedKeys(ankrAdvancedApis).map((n) => Number(n) as keyof typeof ankrAdvancedApis);
export type SupportedChainId = (typeof supportedChainIds)[number];
// We can still support chains that dont have an advanced api
export const rpcApis: SupportedChainId[] = [5000];
export const supportedMainnets: SupportedChainId[] = supportedChainIds;

export const advancedAPIEndpoint = `https://rpc.ankr.com/multichain/${process.env.ANKR_API_ID}`;

export function isAnkrChain(chainId: number): chainId is SupportedChainId {
  return supportedMainnets.includes(chainId as SupportedChainId);
}
