import { zora, zoraTestnet } from 'viem/chains';

export const supportedNetworks = [zora.id, zoraTestnet.id];
export type SupportedChainId = (typeof supportedNetworks)[number];
