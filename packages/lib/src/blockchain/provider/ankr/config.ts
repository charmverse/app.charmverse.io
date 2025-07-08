import env from '@beam-australia/react-env';
import { typedKeys } from '@packages/utils/types';

// Find supported chains:  https://www.ankr.com/docs/advanced-api/overview/#chains-supported
export const ankrAdvancedApis = {
  1: 'eth',
  56: 'bsc',
  1101: 'polygon_zkevm',
  250: 'fantom',
  43114: 'avalanche',
  5000: 'mantle'
} as const;

export const ankrApiId = env('ANKR_API_ID');

export type SupportedChainId = keyof typeof ankrAdvancedApis;

export const supportedChainIds = typedKeys(ankrAdvancedApis).map((n) => Number(n) as keyof typeof ankrAdvancedApis);

export const advancedAPIEndpoint = `https://rpc.ankr.com/multichain/${ankrApiId}`;

export function isAnkrChain(chainId: number): chainId is SupportedChainId {
  return supportedChainIds.some((chain) => chain === chainId);
}
