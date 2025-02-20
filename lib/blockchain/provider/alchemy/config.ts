import { getChainList } from '@packages/connectors/chains';

const chainList = getChainList({ enableTestnets: true });

export const supportedChains = chainList.filter((chain) => chain.alchemyUrl);
export const supportedChainIds = chainList.map((chain) => chain.chainId);
export type SupportedChainId = (typeof supportedChainIds)[number];
export const supportedMainnets: SupportedChainId[] = supportedChains
  .filter((chain) => !chain.testnet)
  .map((chain) => chain.chainId);
