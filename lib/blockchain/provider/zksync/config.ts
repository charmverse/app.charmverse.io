import { zkSync, zkSyncTestnet } from 'viem/chains';

export const supportedNetworks = [zkSync.id, zkSyncTestnet.id];
export type SupportedChainId = (typeof supportedNetworks)[number];
