import { zkSync, zksyncSepoliaTestnet } from 'viem/chains';

export const supportedNetworks = [zkSync.id, zksyncSepoliaTestnet.id];
export type SupportedChainId = (typeof supportedNetworks)[number];

export function isZkSyncChain(chainId: number): chainId is SupportedChainId {
  return supportedNetworks.some((chain) => chain === chainId);
}
