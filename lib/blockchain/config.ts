import { arbitrum, avalanche, base, bsc, mainnet, optimism, polygon } from 'viem/chains';

export const openseaChainsByPath: Record<string, number | undefined> = {
  ethereum: mainnet.id,
  bsc: bsc.id,
  base: base.id,
  arbitrum: arbitrum.id,
  avalanche: avalanche.id,
  matic: polygon.id,
  optimism: optimism.id
};
